import type * as Discord from "discord.js"
import { toError } from "../internal/helpers"
import { DebugLogger, Logger, NoopLogger } from "../internal/logger"
import type { RenderReplyFn } from "./reply-component"
import {
  EphemeralReplyInstance,
  PublicReplyInstance,
  ReplyInstance,
} from "./reply-instance"
import type {
  SlashCommandDefinition,
  SlashCommandEphemeralReplyHandle,
  SlashCommandOptions,
  SlashCommandReplyHandle,
} from "./slash-command"

type DiscordCommandManager =
  | Discord.ApplicationCommandManager
  | Discord.GuildApplicationCommandManager

type UseClientOptions = {
  useGlobalCommands?: boolean
  useGuildCommands?: boolean
}

export class CommandManager {
  #slashCommands = new Map<string, SlashCommandDefinition>()
  #replyInstances = new Set<ReplyInstance>()
  #logger: Logger = new NoopLogger()

  private constructor() {}

  static create() {
    return new CommandManager()
  }

  addSlashCommand<Options extends SlashCommandOptions>(
    slashCommand: SlashCommandDefinition<Options>,
  ) {
    this.#logger.info(`Defining slash command: ${slashCommand.name}`)
    this.#slashCommands.set(slashCommand.name, slashCommand as any)
    return this
  }

  useClient(
    client: Discord.Client,
    {
      useGlobalCommands = true,
      useGuildCommands = false,
    }: UseClientOptions = {},
  ) {
    const syncGuildCommands = async (guild: Discord.Guild) => {
      await guild.commands.fetch()
      if (useGuildCommands) {
        await this.#logger.task(
          `Syncing guild commands for "${guild.name}"`,
          () => this.#syncCommands(guild.commands),
        )
      } else {
        await this.#logger.task(
          `Removing commands for guild "${guild.name}"`,
          () => this.#removeAllCommands(guild.commands),
        )
      }
    }

    client.on("ready", async () => {
      this.#logger.info("Client ready")

      const { application } = client
      if (application) {
        if (useGlobalCommands) {
          await this.#logger.task("Syncing global commands", async () => {
            await application.commands.fetch()
            return this.#syncCommands(application.commands)
          })
        } else {
          await this.#logger.task("Removing global commands", async () => {
            await this.#removeAllCommands(application.commands)
          })
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
        this.#logger.info(`Command interaction id ${interaction.id}`)
        await this.#handleCommandInteraction(interaction)
      }
      if (interaction.isMessageComponent()) {
        this.#logger.info(`Message component interaction id ${interaction.id}`)
        await this.#handleMessageComponentInteraction(interaction)
      }
    })
    return this
  }

  enableLogging() {
    this.#logger = new DebugLogger()
    return this
  }

  disableLogging() {
    this.#logger = new NoopLogger()
    return this
  }

  async #syncCommands(manager: DiscordCommandManager) {
    for (const command of this.#slashCommands.values()) {
      const options = Object.entries(
        command.options ?? {},
      ).map<Discord.ApplicationCommandOptionData>(([name, option]) => ({
        name,
        description: option.description,
        type: option.type,
        required: option.required,
        choices: "choices" in option ? option.choices : undefined,
      }))

      await this.#logger.task(`Creating command "${command.name}"`, () => {
        return manager.create({
          name: command.name,
          description: command.description,
          options,
        })
      })
    }

    for (const appCommand of manager.cache.values()) {
      if (!this.#slashCommands.has(appCommand.name)) {
        await this.#logger.task(
          `Removing unused command "${appCommand.name}"`,
          () => manager.delete(appCommand.id),
        )
      }
    }
  }

  async #removeAllCommands(manager: DiscordCommandManager) {
    for (const command of manager.cache.values()) {
      await this.#logger.task(`Removing command "${command.name}"`, () =>
        manager.delete(command.id),
      )
    }
  }

  async #handleCommandInteraction(interaction: Discord.CommandInteraction) {
    const slashCommand = this.#slashCommands.get(interaction.commandName)
    if (!slashCommand) return

    const member =
      (interaction.member as Discord.GuildMember | null) ?? undefined

    const options: Record<string, string | number | boolean | undefined> = {}

    for (const [name, optionDefinition] of Object.entries(
      slashCommand.options ?? {},
    )) {
      const value = interaction.options.get(name, optionDefinition.required)
      if (!value) continue

      options[value.name] = value.value
    }

    await slashCommand.run({
      member,
      options,
      createReply: (render) => this.#createReplyInstance(interaction, render),
      createEphemeralReply: (render) =>
        this.#createEphemeralReplyInstance(interaction, render),
    })
  }

  #handleMessageComponentInteraction(
    interaction: Discord.MessageComponentInteraction,
  ) {
    interaction.deferUpdate().catch((error) => {
      this.#logger.warn("Failed to defer interaction update")
      this.#logger.warn(toError(error).stack || toError(error).message)
    })

    return Promise.all(
      [...this.#replyInstances].map((instance) =>
        instance.handleMessageComponentInteraction(interaction),
      ),
    )
  }

  async #createReplyInstance(
    interaction: Discord.CommandInteraction,
    render: RenderReplyFn,
  ): Promise<SlashCommandReplyHandle> {
    const instance = await PublicReplyInstance.create(interaction, render)

    if (!instance) {
      return {
        update: async () => {},
        delete: async () => {},
      }
    }

    this.#replyInstances.add(instance)

    return {
      update: async () => {
        await instance.update()
      },
      delete: async () => {
        this.#replyInstances.delete(instance)
        await instance.cleanup()
      },
    }
  }

  async #createEphemeralReplyInstance(
    interaction: Discord.CommandInteraction,
    render: RenderReplyFn,
  ): Promise<SlashCommandEphemeralReplyHandle> {
    const instance = await EphemeralReplyInstance.create(interaction, render)

    if (!instance) {
      return {
        update: async () => {},
      }
    }

    this.#replyInstances.add(instance)

    return {
      update: async () => {
        await instance.update()
      },
    }
  }
}
