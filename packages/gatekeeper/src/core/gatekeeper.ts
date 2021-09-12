import type * as Discord from "discord.js"
import { relative } from "path"
import { isDeepEqual } from "../internal/helpers"
import { createConsoleLogger, createNoopLogger } from "../internal/logger"
import type { UnknownRecord } from "../internal/types"
import type { MessageCommandDefinition } from "./message-command"
import {
  createMessageCommandContext,
  defineMessageCommand,
  isMessageCommandDefinition,
} from "./message-command"
import type {
  SlashCommandDefinition,
  SlashCommandOptions,
} from "./slash-command"
import {
  createSlashCommandContext,
  defineSlashCommand,
  isSlashCommandDefinition,
} from "./slash-command"
import type { UserCommandDefinition } from "./user-command"
import {
  createUserCommandContext,
  defineUserCommand,
  isUserCommandDefinition,
} from "./user-command"

type DiscordCommandManager =
  | Discord.ApplicationCommandManager
  | Discord.GuildApplicationCommandManager

/**
 * Options for creating a gatekeeper instance.
 */
export type GatekeeperOptions = {
  /**
   * The name of the bot. At the moment, only used in debug logging
   */
  name?: string
  /**
   * Enables debug logging. Shows when commands are created, activated, registered, etc.
   */
  debug?: boolean
}

/**
 * Options for attaching a client to a gatekeeper instance.
 */
export type UseClientOptions = {
  /**
   * Registers commands per guild.
   *
   * The commands are immediately available for use, which makes this much better for development, and works fine for small bots that are only used in a few servers.
   *
   * @default true
   */
  useGuildCommands?: boolean

  /**
   * Register global commands.
   *
   * Global commands can be used from any server, and take a while to show up, so this isn't great for testing. I'd recommend only enabling this if you're scaling the bot up to many servers/channels, when using guild commands reaches the 100 total command limit for a bot.
   * @default false
   */
  useGlobalCommands?: boolean
}

/**
 * A command definition
 */
export type AnyCommandDefinition<
  Options extends SlashCommandOptions = SlashCommandOptions,
> =
  | SlashCommandDefinition<Options>
  | UserCommandDefinition
  | MessageCommandDefinition

/**
 * Manages commands and handles interactions.
 */
export type GatekeeperInstance = {
  /**
   * Add a command. Commands should be created using `defineSlashCommand` and friends
   */
  addCommand<Options extends SlashCommandOptions>(
    definition: AnyCommandDefinition<Options>,
  ): void

  /**
   * Load commands from a list of **absolute** file paths
   */
  loadCommands(filePaths: ArrayLike<string>): Promise<void>

  /**
   * Bind event listeners to a discord client, for registering commands on ready, and for handling interactions.
   */
  useClient(client: Discord.Client, options?: UseClientOptions): void
}

/**
 * Create a gatekeeper instance.
 */
export function createGatekeeper({
  name = "gatekeeper-bot",
  debug = false,
}: GatekeeperOptions = {}): GatekeeperInstance {
  const slashCommands = new Map<string, SlashCommandDefinition>()
  const userCommands = new Map<string, UserCommandDefinition>()
  const messageCommands = new Map<string, MessageCommandDefinition>()

  const logger = debug ? createConsoleLogger({ name }) : createNoopLogger()

  const gatekeeper: GatekeeperInstance = {
    addCommand(definition) {
      if (isSlashCommandDefinition(definition)) {
        slashCommands.set(
          definition.name,
          defineSlashCommand(definition) as SlashCommandDefinition,
        )
        logger.info(`Added slash command "${definition.name}"`)
      }

      if (isUserCommandDefinition(definition)) {
        userCommands.set(definition.name, defineUserCommand(definition))
        logger.info(`Added user command "${definition.name}"`)
      }

      if (isMessageCommandDefinition(definition)) {
        messageCommands.set(definition.name, defineMessageCommand(definition))
        logger.info(`Added message command "${definition.name}"`)
      }
    },

    async loadCommands(filePaths) {
      const commandModulePromises = Array.from(filePaths)
        .map((path) => path.replace(/\.[a-z]+$/i, ""))
        .map((path) =>
          logger.promise<UnknownRecord>(
            `Loading command module "${relative(process.cwd(), path)}"`,
            import(path),
          ),
        )

      const commandModules = await logger.promise(
        `Loading ${filePaths.length} commands`,
        Promise.all(commandModulePromises),
      )

      for (const command of commandModules.flatMap<unknown>(Object.values)) {
        if (
          isSlashCommandDefinition(command) ||
          isUserCommandDefinition(command) ||
          isMessageCommandDefinition(command)
        ) {
          gatekeeper.addCommand(command)
        }
      }
    },

    useClient(
      client,
      { useGlobalCommands = false, useGuildCommands = true } = {},
    ) {
      async function syncGuildCommands(guild: Discord.Guild) {
        const existingCommands = await logger.promise(
          `Fetching existing commands for guild "${guild.name}"`,
          guild.commands.fetch(),
        )

        if (useGuildCommands) {
          await syncCommands(guild.commands, existingCommands)
        } else {
          await removeAllCommands(guild.commands, existingCommands)
        }
      }

      client.on("ready", async () => {
        logger.info("Client ready")

        const { application } = client
        if (application) {
          const existingCommands = await logger.promise(
            `Fetching all global commands...`,
            application.commands.fetch(),
          )
          if (useGlobalCommands) {
            await syncCommands(application.commands, existingCommands)
          } else {
            await removeAllCommands(application.commands, existingCommands)
          }
        }

        for (const guild of client.guilds.cache.values()) {
          await syncGuildCommands(guild)
        }
      })

      client.on("guildCreate", async (guild) => {
        await syncGuildCommands(guild)
      })

      client.on("interactionCreate", async (interaction) => {
        if (interaction.isCommand()) {
          await handleCommandInteraction(interaction)
        }
        if (interaction.isContextMenu()) {
          await handleContextMenuInteraction(interaction)
        }
      })
    },
  }

  async function syncCommands(
    manager: DiscordCommandManager,
    existingCommands: Discord.Collection<string, Discord.ApplicationCommand>,
  ) {
    for (const command of slashCommands.values()) {
      const options = Object.entries(
        command.options ?? {},
      ).map<Discord.ApplicationCommandOptionData>(([name, option]) => ({
        name,
        description: option.description,
        type: option.type,
        required: option.required,
        choices: "choices" in option ? option.choices : undefined,
        options: undefined,
      }))

      const commandData: Discord.ApplicationCommandData = {
        name: command.name,
        description: command.description,
        options,
      }

      const existing = existingCommands.find(
        (c) => c.name === command.name && c.type === "CHAT_INPUT",
      )

      const existingCommandData = existing && {
        name: existing.name,
        description: existing.description,
        options: existing.options,
      }

      if (isDeepEqual(commandData, existingCommandData)) continue

      await logger.promise(
        `Registering slash command "${command.name}"`,
        manager.create(commandData),
      )
    }

    for (const command of userCommands.values()) {
      if (
        existingCommands.some(
          (c) => c.name === command.name && c.type === "USER",
        )
      )
        continue
      await logger.promise(
        `Registering user command "${command.name}"`,
        manager.create({
          type: "USER",
          name: command.name,
        }),
      )
    }

    for (const command of messageCommands.values()) {
      if (
        existingCommands.some(
          (c) => c.name === command.name && c.type === "MESSAGE",
        )
      )
        continue
      await logger.promise(
        `Registering message command "${command.name}"`,
        manager.create({
          type: "MESSAGE",
          name: command.name,
        }),
      )
    }

    const allCommandNames = new Set([
      ...slashCommands.keys(),
      ...userCommands.keys(),
      ...messageCommands.keys(),
    ])

    for (const appCommand of existingCommands.values()) {
      if (!allCommandNames.has(appCommand.name)) {
        await logger.promise(
          `Removing unused command "${appCommand.name}"`,
          manager.delete(appCommand.id),
        )
      }
    }
  }

  async function removeAllCommands(
    manager: DiscordCommandManager,
    commands: Discord.Collection<string, Discord.ApplicationCommand>,
  ) {
    for (const command of commands.values()) {
      await logger.promise(
        `Removing command "${command.name}"`,
        manager.delete(command.id),
      )
    }
  }

  async function handleCommandInteraction(
    interaction: Discord.CommandInteraction,
  ) {
    const slashCommand = slashCommands.get(interaction.commandName)
    if (!slashCommand) return

    logger.info(`Running slash command "${interaction.commandName}"`)
    const context = createSlashCommandContext(slashCommand, interaction, logger)
    await slashCommand.run(context)
  }

  async function handleContextMenuInteraction(
    interaction: Discord.ContextMenuInteraction,
  ) {
    const userCommand = userCommands.get(interaction.commandName)
    if (interaction.targetType === "USER" && userCommand) {
      logger.info(`Running user command "${userCommand.name}"`)
      const context = await createUserCommandContext(interaction, logger)
      await userCommand.run(context)
    }

    const messageCommand = messageCommands.get(interaction.commandName)
    if (interaction.targetType === "MESSAGE" && messageCommand) {
      logger.info(`Running message command "${messageCommand.name}"`)
      const context = await createMessageCommandContext(interaction, logger)
      await messageCommand.run(context)
    }
  }

  return gatekeeper
}
