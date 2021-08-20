import type * as Discord from "discord.js"
import { relative } from "path"
import { createConsoleLogger, createNoopLogger } from "../internal/logger"
import type { UnknownRecord } from "../internal/types"
import type {
  SlashCommandDefinition,
  SlashCommandDefinitionWithoutType,
  SlashCommandOptions,
} from "./slash-command"
import {
  createSlashCommandContext,
  defineSlashCommand,
  isSlashCommandDefinition,
} from "./slash-command"

type CommandManagerOptions = {
  /**
   * Enables debug logging. This will literally spam your console.
   */
  debug?: boolean
}

type UseClientOptions = {
  useGlobalCommands?: boolean
  useGuildCommands?: boolean
}

type DiscordCommandManager =
  | Discord.ApplicationCommandManager
  | Discord.GuildApplicationCommandManager

export function createGatekeeper({
  debug = false,
}: CommandManagerOptions = {}) {
  const slashCommands = new Map<string, SlashCommandDefinition>()

  const logger = debug
    ? createConsoleLogger({ name: "gatekeeper" })
    : createNoopLogger()

  async function syncCommands(manager: DiscordCommandManager) {
    for (const command of slashCommands.values()) {
      const options = Object.entries(
        command.options ?? {},
      ).map<Discord.ApplicationCommandOptionData>(([name, option]) => ({
        name,
        description: option.description,
        type: option.type,
        required: option.required,
        choices: "choices" in option ? option.choices : undefined,
      }))

      await logger.promise(
        `Creating command "${command.name}"`,
        manager.create({
          name: command.name,
          description: command.description,
          options,
        }),
      )
    }

    for (const appCommand of manager.cache.values()) {
      if (!slashCommands.has(appCommand.name)) {
        await logger.promise(
          `Removing unused command "${appCommand.name}"`,
          manager.delete(appCommand.id),
        )
      }
    }
  }

  async function removeAllCommands(manager: DiscordCommandManager) {
    for (const command of manager.cache.values()) {
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

    const context = createSlashCommandContext(slashCommand, interaction, logger)
    await slashCommand.run(context)
    await context.flushReplyQueue()
  }

  const gatekeeper = {
    addSlashCommand<Options extends SlashCommandOptions>(
      definition: SlashCommandDefinitionWithoutType<Options>,
    ) {
      slashCommands.set(
        definition.name,
        defineSlashCommand(definition) as SlashCommandDefinition,
      )
      logger.info(`Added slash command "${definition.name}"`)
    },

    async loadCommands(filePaths: ArrayLike<string>) {
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
        if (isSlashCommandDefinition(command)) {
          gatekeeper.addSlashCommand(command)
        }
      }
    },

    useClient(
      client: Discord.Client,
      {
        useGlobalCommands = true,
        useGuildCommands = false,
      }: UseClientOptions = {},
    ) {
      async function syncGuildCommands(guild: Discord.Guild) {
        await guild.commands.fetch()
        if (useGuildCommands) {
          await logger.promise(
            `Syncing guild commands for "${guild.name}"`,
            syncCommands(guild.commands),
          )
        } else {
          await logger.promise(
            `Removing commands for guild "${guild.name}"`,
            removeAllCommands(guild.commands),
          )
        }
      }

      client.on("ready", async () => {
        logger.info("Client ready")

        const { application } = client
        if (application) {
          if (useGlobalCommands) {
            await application.commands.fetch()
            await logger.promise(
              "Syncing global commands",
              syncCommands(application.commands),
            )
          } else {
            await logger.promise(
              "Removing global commands",
              removeAllCommands(application.commands),
            )
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
      })
    },
  }

  return gatekeeper
}
