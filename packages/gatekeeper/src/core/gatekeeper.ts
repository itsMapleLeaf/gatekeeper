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
import { join, relative } from "node:path"
import { raise } from "../internal/helpers"
import type { Logger } from "../internal/logger"
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

export type GatekeeperConfig = {
  client: Client
  name?: string
  logging?: boolean
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
}

/** Basic information about the commands currently added */
export type CommandInfo = {
  /** The name of the command */
  name: string
}

export class Gatekeeper {
  private readonly commands = new Set<Command>()
  private readonly commandInstances = new Set<CommandInstance>()
  private readonly logger: Logger

  private constructor(logger: Logger) {
    this.logger = logger
  }

  static async create({
    name = "gatekeeper",
    logging = true,
    scope = "guild",
    ...config
  }: GatekeeperConfig) {
    const instance = new Gatekeeper(
      logging ? createConsoleLogger({ name }) : createNoopLogger(),
    )

    if (config.commandFolder) {
      await instance.loadCommandsFromFolder(config.commandFolder)
    }

    instance.addEventListeners(config.client, scope)

    return instance
  }

  getCommands(): readonly CommandInfo[] {
    return [...this.commands]
  }

  addSlashCommand<Options extends SlashCommandOptionConfigMap>(
    config: SlashCommandConfig<Options>,
  ) {
    this.addCommand(defineSlashCommand(config))
  }

  addUserCommand(config: UserCommandConfig) {
    this.addCommand(defineUserCommand(config))
  }

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
      })

      await Promise.all(
        files.map(async (filename) => {
          const mod = await import(join(folderPath, filename))
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
    const commandsToRemove = existingCommands.filter((appCommand) => {
      const isUsingCommand = [...this.commands].some((command) => {
        return command.matchesExisting(appCommand)
      })
      return !isUsingCommand
    })
    if (commandsToRemove.size > 0) {
      this.logger.info(`Removing ${commandsToRemove.size} command(s) ${scope}`)
      for (const [, command] of commandsToRemove) {
        await command.delete()
      }
    }

    const commandsToCreate = [...this.commands].filter((command) => {
      const isExisting = existingCommands.some((appCommand) => {
        return command.matchesExisting(appCommand)
      })
      return !isExisting
    })
    if (commandsToCreate.length > 0) {
      this.logger.info(
        `Creating ${commandsToCreate.length} command(s) ${scope}`,
      )
      for (const command of commandsToCreate) {
        await command.register(commandManager)
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
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
      }
    }
  }
}
