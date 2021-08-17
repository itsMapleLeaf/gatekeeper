import type * as Discord from "discord.js"
import { relative } from "path"
import { toError } from "../internal/helpers"
import type { Logger } from "../internal/logger"
import { ConsoleLogger, NoopLogger } from "../internal/logger"
import type { RenderReplyFn } from "./reply-component"
import type { ReplyInstance } from "./reply-instance"
import { EphemeralReplyInstance, PublicReplyInstance } from "./reply-instance"
import type {
  SlashCommandDefinition,
  SlashCommandEphemeralReplyHandle,
  SlashCommandOptions,
  SlashCommandReplyHandle,
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

export class CommandManager {
  readonly #slashCommands = new Map<string, SlashCommandDefinition>()
  readonly #replyInstances = new Set<ReplyInstance>()
  readonly logger: Logger

  private constructor(options: CommandManagerOptions) {
    this.logger = options.debug
      ? ConsoleLogger.withName("gatekeeper")
      : new NoopLogger()
  }

  static create(options: CommandManagerOptions = {}) {
    return new CommandManager(options)
  }

  addSlashCommand<Options extends SlashCommandOptions>(
    slashCommand: SlashCommandDefinition<Options>,
  ) {
    this.logger.info(`Defining slash command: ${slashCommand.name}`)
    this.#slashCommands.set(slashCommand.name, slashCommand as any)
  }

  /**
   * A list of **absoluete** file paths to load commands from.
   */
  async loadCommands(filePaths: ArrayLike<string>) {
    await this.logger.task(`Loading ${filePaths.length} commands`, async () => {
      const commandModules = await Promise.all(
        Array.from(filePaths)
          .map((path) => path.replace(/\.[a-z]+$/i, ""))
          .map((path) =>
            this.logger.task(
              `Loading command module "${relative(process.cwd(), path)}"`,
              () => import(path),
            ),
          ),
      )

      const commands = commandModules.flatMap(Object.values)

      for (const command of commands) {
        this.addSlashCommand(command)
      }
    })
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
        await this.logger.task(
          `Syncing guild commands for "${guild.name}"`,
          () => this.#syncCommands(guild.commands),
        )
      } else {
        await this.logger.task(
          `Removing commands for guild "${guild.name}"`,
          () => this.#removeAllCommands(guild.commands),
        )
      }
    }

    client.on("ready", async () => {
      this.logger.info("Client ready")

      const { application } = client
      if (application) {
        if (useGlobalCommands) {
          await this.logger.task("Syncing global commands", async () => {
            await application.commands.fetch()
            return this.#syncCommands(application.commands)
          })
        } else {
          await this.logger.task("Removing global commands", async () => {
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
        this.logger.info(`Command interaction id ${interaction.id}`)
        await this.#handleCommandInteraction(interaction)
      }
      if (interaction.isMessageComponent()) {
        this.logger.info(`Message component interaction id ${interaction.id}`)
        await this.#handleMessageComponentInteraction(interaction)
      }
    })
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

      await this.logger.task(`Creating command "${command.name}"`, () => {
        return manager.create({
          name: command.name,
          description: command.description,
          options,
        })
      })
    }

    for (const appCommand of manager.cache.values()) {
      if (!this.#slashCommands.has(appCommand.name)) {
        await this.logger.task(
          `Removing unused command "${appCommand.name}"`,
          () => manager.delete(appCommand.id),
        )
      }
    }
  }

  async #removeAllCommands(manager: DiscordCommandManager) {
    for (const command of manager.cache.values()) {
      await this.logger.task(`Removing command "${command.name}"`, () =>
        manager.delete(command.id),
      )
    }
  }

  async #handleCommandInteraction(interaction: Discord.CommandInteraction) {
    const slashCommand = this.#slashCommands.get(interaction.commandName)
    if (!slashCommand) return

    const options: Record<string, string | number | boolean | undefined> = {}

    for (const [name, optionDefinition] of Object.entries(
      slashCommand.options ?? {},
    )) {
      const value = interaction.options.get(name, optionDefinition.required)
      if (!value) continue

      options[value.name] = value.value
    }

    await slashCommand.run({
      channel: interaction.channel ?? undefined,
      member: (interaction.member as Discord.GuildMember | null) ?? undefined,
      user: interaction.user,
      guild: interaction.guild ?? undefined,
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
      this.logger.warn("Failed to defer interaction update")
      this.logger.warn(toError(error).stack || toError(error).message)
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
