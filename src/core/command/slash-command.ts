import type {
  ApplicationCommandChannelOptionData,
  ApplicationCommandData,
  ApplicationCommandOptionData,
  ChatInputApplicationCommandData,
  CommandInteraction,
  GuildChannel,
  Role,
} from "discord.js"
import { GuildMember, User } from "discord.js"
import { isDeepEqual, raise } from "../../internal/helpers"
import type { ValueOf } from "../../internal/types"
import type { InteractionContext } from "../interaction-context"
import { createInteractionContext } from "../interaction-context"
import type { Command } from "./command"
import { createCommand } from "./command"

/**
 * Configuration for a slash command. See {@link Gatekeeper.addSlashCommand}
 */
export type SlashCommandConfig<
  Options extends SlashCommandOptionConfigMap = SlashCommandOptionConfigMap,
> = {
  /**
   * The name of the command.
   * e.g. If you pass the name "airhorn",
   * the command will be run with /airhorn in Discord
   */
  name: string

  /** Aliases: alternate names to call this command with */
  aliases?: string[]

  /**
   * The description of the command.
   * Shows up when showing a list of the bot's commands
   */
  description: string

  /**
   * An object of options for the command, also called arguments, or parameters.
   */
  options?: Options

  /**
   * The function to run when the command is called.
   * Receives a {@link SlashCommandInteractionContext} object as the first argument.
   */
  run: (
    context: SlashCommandInteractionContext<Options>,
  ) => void | Promise<unknown>
}

/**
 * Valid slash command option config, only used for typescript inference
 */
export type SlashCommandOptionConfigMap = {
  [name: string]: SlashCommandOptionConfig
}

/**
 * A possible option for a slash command.
 * See {@link SlashCommandOptionValueMap} for a list of possible options
 * and the values they resolve to.
 */
export type SlashCommandOptionConfig = SlashCommandOptionConfigBase &
  (
    | {
        type: "STRING"
        choices?: Array<SlashCommandOptionChoiceConfig<string>>
      }
    | {
        type: "NUMBER" | "INTEGER"
        choices?: Array<SlashCommandOptionChoiceConfig<number>>
      }
    | { type: "BOOLEAN" }
    | { type: "USER" }
    | {
        type: "CHANNEL"
        channelTypes?: SlashCommandOptionChannelType[]
      }
    | { type: "ROLE" }
    | { type: "MENTIONABLE" }
  )

/**
 * All possible channel types to filter by when using the `CHANNEL` option type
 */
export type SlashCommandOptionChannelType =
  | "GUILD_TEXT"
  | "DM"
  | "GUILD_VOICE"
  | "GROUP_DM"
  | "GUILD_CATEGORY"
  | "GUILD_NEWS"
  | "GUILD_STORE"
  | "GUILD_NEWS_THREAD"
  | "GUILD_PUBLIC_THREAD"
  | "GUILD_PRIVATE_THREAD"
  | "GUILD_STAGE_VOICE"

/**
 * A potential choice for a slash command option
 */
export type SlashCommandOptionChoiceConfig<Value> = {
  name: string
  value: Value
}

/**
 * This is the magic that takes your option config
 * and gives you a typesafe object of values.
 */
export type SlashCommandOptionValues<
  Options extends SlashCommandOptionConfigMap,
> = {
  [Name in keyof Options]: Options[Name]["required"] extends true
    ? SlashCommandOptionValueMap[Options[Name]["type"]]
    : SlashCommandOptionValueMap[Options[Name]["type"]] | undefined
}

/**
 * A map of option types to the kind of value it resolves to.
 * e.g. If an option has a type of "NUMBER", it will resolve to a number.
 */
export type SlashCommandOptionValueMap = {
  STRING: string
  NUMBER: number
  INTEGER: number
  BOOLEAN: boolean
  USER: User
  CHANNEL: GuildChannel
  ROLE: Role
  MENTIONABLE: SlashCommandMentionableValue
}

/**
 * A resolved mentionable option for a slash command
 */
export type SlashCommandMentionableValue = {
  /**
   * A string that can be sent in a message as a mention.
   * e.g. `"<@!123456789>"` for users, `"<@&123456789>"` for roles
   */
  mention: string
} & (
  | {
      /**
       * Whether or not this mention is a user mention.
       * If using typescript, this property _must_ be checked
       * to use the related properties
       */
      isUser: true

      /**
       * The mentioned user
       */
      user: User

      /**
       * The guild (server) member object, if in a guild
       */
      guildMember: GuildMember | undefined
    }
  | {
      /**
       * Whether or not this mention is a user mention.
       * If using typescript, this property _must_ be checked
       * to use the related properties
       */
      isUser: false

      /**
       * The role that was mentioned, only available in guilds (servers)
       */
      role: Role
    }
)

/**
 * The interaction context for a slash command
 */
export type SlashCommandInteractionContext<
  Options extends SlashCommandOptionConfigMap = SlashCommandOptionConfigMap,
> = InteractionContext & {
  /**
   * An object of the options that were passed when running the slash command
   */
  options: SlashCommandOptionValues<Options>
}

/**
 * Shared properties for all slash command option types
 */
export type SlashCommandOptionConfigBase = {
  /**
   * Description for the option, shows up when tabbing through the options in Discord
   */
  description: string

  /**
   * Whether the option is required.
   * If true, the value will be guaranteed to exist in the options object,
   * otherwise it will be undefined
   */
  required?: boolean
}

/** Sorts channel types based on Discord's list */
function sortChannelTypes(
  arrA: SlashCommandOptionChannelType[],
): SlashCommandOptionChannelType[] {
  const channelTypesOrder = [
    "GUILD_TEXT",
    "DM",
    "GUILD_VOICE",
    "GROUP_DM",
    "GUILD_CATEGORY",
    "GUILD_NEWS",
    "GUILD_STORE",
    "GUILD_NEWS_THREAD",
    "GUILD_PUBLIC_THREAD",
    "GUILD_PRIVATE_THREAD",
    "GUILD_STAGE_VOICE",
  ]
  return [...arrA].sort(
    (a, b) => channelTypesOrder.indexOf(a) - channelTypesOrder.indexOf(b),
  )
}

export function createSlashCommands<
  Options extends SlashCommandOptionConfigMap,
>(config: SlashCommandConfig<Options>): Command[] {
  const names = [config.name, ...(config.aliases || [])]

  return names.map((name) => {
    const options: ApplicationCommandOptionData[] = Object.entries(
      config.options ?? {},
    ).map(([name, option]) => ({
      name,
      description: option.description,
      type: option.type,

      // discord always returns a boolean, even if the user didn't send one
      required: option.required ?? false,

      // discord returns undefined if the user passed an empty array,
      // so normalize undefined to an empty array
      choices: ("choices" in option && option.choices) || [],

      // Discord returns channel types in a specific order
      channelTypes:
        ("channelTypes" in option &&
          sortChannelTypes(option.channelTypes ?? [])) ||
        undefined,
    }))

    const commandData: ApplicationCommandData = {
      name,
      description: config.description,
      options,
    }

    return createCommand({
      name,

      matchesExisting: (command) => {
        if (command.type !== "CHAT_INPUT") return false

        const existingCommandData: ChatInputApplicationCommandData = {
          name: command.name,
          description: command.description,
          // need to use the same shape so they can be compared
          options: command.options.map(
            (option): ApplicationCommandOptionData => ({
              name: option.name,
              description: option.description,
              type: option.type,
              required: (option as any).required, // ???
              choices: ("choices" in option && option.choices) || [],
              /* option.channelTypes includes "UNKNOWN", but it's not allowed by ApplicationCommandOptionData */
              channelTypes:
                (("channelTypes" in option &&
                  option.channelTypes) as ApplicationCommandChannelOptionData["channelTypes"]) ||
                undefined,
            }),
          ),
        }

        return isDeepEqual(commandData, existingCommandData)
      },

      register: async (manager) => {
        await manager.create(commandData)
      },

      matchesInteraction: (interaction) => {
        return interaction.isCommand() && interaction.commandName === name
      },

      run: async (interaction, command) => {
        await config.run({
          ...createInteractionContext({ interaction, command }),
          options: collectSlashCommandOptionValues(
            config,
            interaction as CommandInteraction,
          ),
        })
      },
    })
  })
}

function collectSlashCommandOptionValues<
  Options extends SlashCommandOptionConfigMap,
>(
  slashCommand: SlashCommandConfig<Options>,
  interaction: CommandInteraction,
): SlashCommandOptionValues<Options> {
  const options: Record<
    string,
    ValueOf<SlashCommandOptionValueMap> | undefined
  > = {}

  for (const [name, optionDefinition] of Object.entries(
    slashCommand.options ?? {},
  )) {
    if (optionDefinition.type === "STRING") {
      options[name] =
        interaction.options.getString(name, optionDefinition.required) ??
        optionFallback(name, optionDefinition, slashCommand)
    }

    if (optionDefinition.type === "NUMBER") {
      options[name] =
        interaction.options.getNumber(name, optionDefinition.required) ??
        optionFallback(name, optionDefinition, slashCommand)
    }

    if (optionDefinition.type === "INTEGER") {
      options[name] =
        interaction.options.getInteger(name, optionDefinition.required) ??
        optionFallback(name, optionDefinition, slashCommand)
    }

    if (optionDefinition.type === "BOOLEAN") {
      options[name] =
        interaction.options.getBoolean(name, optionDefinition.required) ??
        optionFallback(name, optionDefinition, slashCommand)
    }

    if (optionDefinition.type === "USER") {
      options[name] =
        interaction.options.getUser(name, optionDefinition.required) ??
        optionFallback(name, optionDefinition, slashCommand)
    }

    if (optionDefinition.type === "CHANNEL") {
      const channel = interaction.options.getChannel(
        name,
        optionDefinition.required,
      ) as GuildChannel | null

      options[name] =
        channel ?? optionFallback(name, optionDefinition, slashCommand)
    }

    if (optionDefinition.type === "ROLE") {
      const role = interaction.options.getRole(
        name,
        optionDefinition.required,
      ) as Role | null

      options[name] =
        role ?? optionFallback(name, optionDefinition, slashCommand)
    }

    if (optionDefinition.type === "MENTIONABLE") {
      const value = interaction.options.getMentionable(
        name,
        optionDefinition.required,
      ) as User | GuildMember | Role | null

      options[name] = value
        ? createResolvedMentionable(value)
        : optionFallback(name, optionDefinition, slashCommand)
    }
  }
  return options as SlashCommandOptionValues<Options>
}

function createResolvedMentionable(
  value: User | GuildMember | Role,
): SlashCommandMentionableValue {
  if (value instanceof User) {
    return {
      isUser: true,
      user: value,
      guildMember: undefined,
      mention: `<@!${value.id}>`,
    }
  }

  if (value instanceof GuildMember) {
    return {
      isUser: true,
      user: value.user,
      guildMember: value,
      mention: `<@!${value.id}>`,
    }
  }

  return {
    isUser: false,
    role: value,
    mention: `<@&${value.id}>`,
  }
}

function optionFallback(
  optionName: string,
  optionDefinition: SlashCommandOptionConfig,
  slashCommand: SlashCommandConfig<any>,
): string | number | boolean | undefined {
  return optionDefinition.required
    ? raise(
        `Could not get required option "${optionName}" for command "${slashCommand.name}"`,
      )
    : undefined
}
