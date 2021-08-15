import type * as Discord from "discord.js"
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
  debug?: boolean
  createGuildCommands?: boolean
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
    { createGuildCommands = false }: UseClientOptions = {},
  ) {
    client.on("ready", async () => {
      this.#logger.info("Client ready")

      if (client.application) {
        this.#logger.info("Syncing global commands...")
        await client.application.commands.fetch()
        await this.#syncCommands(client.application.commands)
        this.#logger.info("Syncing global commands... done")
      }

      for (const guild of client.guilds.cache.values()) {
        if (createGuildCommands) {
          this.#logger.info(`Syncing commands for guild "${guild.name}"...`)
          await guild.commands.fetch()
          await this.#syncCommands(guild.commands)
          this.#logger.info(
            `Syncing commands for guild "${guild.name}"... done`,
          )
        }
      }
    })

    client.on("guildCreate", async (guild) => {
      if (createGuildCommands) {
        this.#logger.info(`Syncing commands for guild "${guild.name}"...`)
        await guild.commands.fetch()
        await this.#syncCommands(guild.commands)
        this.#logger.info(`Syncing commands for guild "${guild.name}"... done`)
      }
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
    interaction.deferUpdate().catch(console.warn)

    return Promise.all(
      [...this.#replyInstances].map((instance) =>
        instance.handleMessageComponentInteraction(interaction),
      ),
    )
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

      this.#logger.info(`Creating command "${command.name}"...`)
      await manager.create({
        name: command.name,
        description: command.description,
        options,
      })
      this.#logger.info(`Creating command "${command.name}"... done`)
    }

    for (const appCommand of manager.cache.values()) {
      if (!this.#slashCommands.has(appCommand.name)) {
        this.#logger.info(`Removing unused command "${appCommand.name}"...`)
        await manager.delete(appCommand.id)
        this.#logger.info(
          `Removing unused command "${appCommand.name}"... done`,
        )
      }
    }
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
