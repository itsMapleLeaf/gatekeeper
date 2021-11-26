import chalk from "chalk"
import type {
  ApplicationCommand,
  BaseCommandInteraction,
  Client,
  Collection,
  Guild,
  MessageComponentInteraction,
} from "discord.js"
import glob from "fast-glob"
import { relative } from "node:path"
import { raise, toError } from "../internal/helpers"
import type { ConsoleLoggerLevel, Logger } from "../internal/logger"
import { createConsoleLogger, createNoopLogger } from "../internal/logger"
import type { DiscordCommandManager } from "../internal/types"
import type { Command } from "./command/command"
import { CommandInstance } from "./command/command"
import type { MessageCommandConfig } from "./command/message-command"
import { defineMessageCommand } from "./command/message-command"
import type {
  SlashCommandConfig,
  SlashCommandOptionConfigMap,
} from "./command/slash-command"
import { defineSlashCommand } from "./command/slash-command"
import type { UserCommandConfig } from "./command/user-command"
import { defineUserCommand } from "./command/user-command"

/** Options for creating a gatekeeper instance */
export type GatekeeperConfig = {
  /** A Discord.JS client */
  client: Client

  /** The name of the bot, used for logger messages */
  name?: string

  /** Show colorful debug logs in the console */
  logging?: boolean | ConsoleLoggerLevel[]

  /**
   * An *absolute path* to a folder with command files.
   * Each file should `export default` a function to accept a gatekeeper instance
   * and add commands to it.
   *
   * ```ts
   * // main.ts
   * Gatekeeper.create({
   *   commandFolder: join(__dirname, "commands"),
   * })
   * ```
   * ```ts
   * // commands/ping.ts
   * export default function addCommands(gatekeeper) {
   *   gatekeeper.addCommand({
   *     name: "ping",
   *     description: "Pong!",
   *     run: (ctx) => ctx.reply(() => "Pong!"),
   *   })
   * }
   * ```
   */
  commandFolder?: string

  /**
   * Where commands should be registered.
   *
   * `guild` - Register commands in all guilds (servers) that the bot joins, which appear immediately.
   * This is the default, and recommended for testing, or if your bot is just in a few guilds.
   *
   * `global` - Register commands globally, which can take a few minutes or an hour to show up.
   * Since bots have a global command limit, this is good for when your bot grows beyond just a few servers.
   *
   * `both` - Register commands in both guilds and globally.
   *
   * See the discord docs for more info: https://discord.com/developers/docs/interactions/application-commands#registering-a-command
   */
  scope?: "guild" | "global" | "both"

  /**
   * Called when any error occurs.
   * You can use this to log your own errors, send them to an error reporting service, etc.
   */
  onError?: (error: Error) => void
}

/** Basic information about the commands currently added */
export type CommandInfo = {
  /** The name of the command */
  name: string
}

/**
 * A gatekeeper instance.
 * Holds commands, manages discord interactions, etc.
 */
export class Gatekeeper {
  private readonly commands = new Set<Command>()
  private readonly commandInstances = new Set<CommandInstance>()

  private constructor(
    private readonly config: GatekeeperConfig,
    private readonly logger: Logger,
  ) {}

  /** Create a {@link Gatekeeper} instance */
  static async create(config: GatekeeperConfig) {
    const logger = createGatekeeperLogger(config)
    const instance = new Gatekeeper(config, logger)

    if (config.commandFolder) {
      await instance.loadCommandsFromFolder(config.commandFolder)
    }

    instance.addEventListeners(config.client, config.scope ?? "guild")

    return instance
  }

  /** Returns a list of basic info for each added command */
  getCommands(): readonly CommandInfo[] {
    return [...this.commands]
  }

  /**
   * Add a slash command
   * ```ts
   * gatekeeper.addSlashCommand({
   *   name: "ping",
   *   description: "Pong!",
   *   run: (ctx) => ctx.reply(() => "Pong!"),
   * })
   * ```
   */
  addSlashCommand<Options extends SlashCommandOptionConfigMap>(
    config: SlashCommandConfig<Options>,
  ) {
    this.addCommand(defineSlashCommand(config))
  }

  /**
   * Add a user command
   * ```ts
   * gatekeeper.addUserCommand({
   *   name: 'get user color',
   *   run: (ctx) => ctx.reply(() => ctx.targetGuildMember?.color ?? "not in a guild!"),
   * })
   * ```
   */
  addUserCommand(config: UserCommandConfig) {
    this.addCommand(defineUserCommand(config))
  }

  /**
   * Add a message command
   * ```ts
   * gatekeeper.addMessageCommand({
   *   name: 'reverse',
   *   run: (ctx) => {
   *     ctx.reply(() => ctx.targetMessage.content.split("").reverse().join(""))
   *   }
   * })
   * ```
   */
  addMessageCommand(config: MessageCommandConfig) {
    this.addCommand(defineMessageCommand(config))
  }

  private addCommand(command: Command) {
    this.commands.add(command)
  }

  private addEventListeners(
    client: Client,
    scope: NonNullable<GatekeeperConfig["scope"]>,
  ) {
    client.on(
      "ready",
      this.withErrorHandler(async () => {
        const commandList = [...this.commands]
          .map((command) => chalk.bold(command.name))
          .join(", ")

        this.logger.success(`Using commands: ${commandList}`)

        for (const guild of client.guilds.cache.values()) {
          if (scope === "guild" || scope === "both") {
            await this.syncGuildCommands(guild)
          } else {
            await this.removeAllCommands(
              await guild.commands.fetch(),
              `in ${guild.name}`,
            )
          }
        }

        if (scope === "global" || scope === "both") {
          await this.syncGlobalCommands(client)
        } else if (client.application) {
          await this.removeAllCommands(
            await client.application.commands.fetch(),
            "globally",
          )
        }
      }),
    )

    client.on(
      "guildCreate",
      this.withErrorHandler(async (guild) => {
        if (scope === "guild" || scope === "both") {
          await this.syncGuildCommands(guild)
        } else {
          await this.removeAllCommands(
            await guild.commands.fetch(),
            `in ${guild.name}`,
          )
        }
      }),
    )

    client.on(
      "interactionCreate",
      this.withErrorHandler(async (interaction) => {
        if (interaction.isCommand() || interaction.isContextMenu()) {
          await this.handleCommandInteraction(interaction)
        }
        if (interaction.isMessageComponent()) {
          await this.handleComponentInteraction(interaction)
        }
      }),
    )
  }

  private async loadCommandsFromFolder(folderPath: string) {
    // backslashes are ugly
    const localPath = relative(process.cwd(), folderPath).replace(/\\/g, "/")

    await this.logger.block(`Loading commands from ${localPath}`, async () => {
      const files = await glob(`./**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}`, {
        cwd: folderPath,
        absolute: true,
      })

      await Promise.all(
        files.map(async (path) => {
          const mod = require(path)
          const fn = mod.default || mod
          if (typeof fn === "function") fn(this)
        }),
      )
    })
  }

  private async syncGuildCommands(guild: Guild) {
    await this.logger.block(`Syncing commands for ${guild.name}`, async () => {
      await this.syncCommands(
        `in ${guild.name}`,
        guild.commands,
        await guild.commands.fetch(),
      )
    })
  }

  private async syncGlobalCommands(client: Client) {
    await this.logger.block(`Syncing global commands`, async () => {
      const commandManager =
        client.application?.commands ?? raise("No client application found")

      await this.syncCommands(
        `globally`,
        commandManager,
        await commandManager.fetch(),
      )
    })
  }

  private async syncCommands(
    scope: string,
    commandManager: DiscordCommandManager,
    existingCommands: Collection<string, ApplicationCommand>,
  ) {
    // remove commands first,
    // just in case we've hit the max number of commands
    for (const [, appCommand] of existingCommands) {
      const isUsingCommand = [...this.commands].some((command) => {
        return command.matchesExisting(appCommand)
      })
      if (!isUsingCommand) {
        await appCommand.delete()
        this.logger.info(
          `Removed unused ${scope}: ${chalk.bold(appCommand.name)}`,
        )
      }
    }

    for (const command of this.commands) {
      const isExisting = existingCommands.some((appCommand) => {
        return command.matchesExisting(appCommand)
      })
      if (!isExisting) {
        await command.register(commandManager)
        this.logger.info(`Created ${scope}: ${chalk.bold(command.name)}`)
      }
    }
  }

  private async removeAllCommands(
    commands: Collection<string, ApplicationCommand>,
    scope: string,
  ) {
    if (commands.size === 0) return

    await this.logger.block(`Removing all commands ${scope}`, async () => {
      for (const [, command] of commands) {
        await command.delete()
      }
    })
  }

  private async handleCommandInteraction(interaction: BaseCommandInteraction) {
    const command = [...this.commands.values()].find((command) =>
      command.matchesInteraction(interaction),
    )
    if (!command) return

    const instance = new CommandInstance(command, this.logger)
    this.commandInstances.add(instance)

    try {
      await command.run(interaction, instance)
    } catch (error) {
      this.logger.error(`Error running command`, chalk.bold(command.name))
      this.logger.error(error)
      this.config.onError?.(toError(error))
    }
  }

  private async handleComponentInteraction(
    interaction: MessageComponentInteraction,
  ) {
    for (const context of this.commandInstances) {
      if (await context.handleComponentInteraction(interaction)) return
    }
  }

  private withErrorHandler<Args extends unknown[], Return>(
    fn: (...args: Args) => Promise<Return> | Return,
  ) {
    return async (...args: Args) => {
      try {
        return await fn(...args)
      } catch (error) {
        this.logger.error("An error occurred:", error)
        this.config.onError?.(toError(error))
      }
    }
  }
}

export function createGatekeeperLogger(config: GatekeeperConfig) {
  if (config.logging === true || config.logging == null) {
    return createConsoleLogger({ name: config.name })
  }

  if (!config.logging) {
    return createNoopLogger()
  }

  return createConsoleLogger({ name: config.name, levels: config.logging })
}
