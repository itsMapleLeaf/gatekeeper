import * as Discord from "discord.js"
import { createActionQueue } from "../internal/action-queue.old"
import { isAnyObject, raise } from "../internal/helpers"
import type { Logger } from "../internal/logger"
import type { OptionalKeys, ValueOf } from "../internal/types"
import type { InteractionContext } from "./interaction-context"
import { createInteractionContext } from "./interaction-context"

/**
 * @see defineSlashCommand
 */
export type SlashCommandDefinition<
  Options extends SlashCommandOptions = SlashCommandOptions,
> = {
  __type: typeof slashCommandType
  /**
   * The name of the command.
   * e.g. If you pass the name "airhorn",
   * the command will be run with /airhorn in Discord
   */
  name: string

  /**
   * The description of the command.
   * Shows up when showing a list of the bot's commands
   */
  description: string

  /**
   * An object of options for the command, also called arguments, or parameters.
   * @see defineSlashCommand
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
 * A possible option for a slash command.
 * See {@link SlashCommandOptionValueMap} for a list of possible options
 * and the values they resolve to.
 */
export type SlashCommandOptionDefinition = SlashCommandOptionDefinitionBase &
  (
    | {
        type: "STRING"
        choices?: Array<SlashCommandOptionDefinitionChoice<string>>
      }
    | {
        type: "NUMBER" | "INTEGER"
        choices?: Array<SlashCommandOptionDefinitionChoice<number>>
      }
    | { type: "BOOLEAN" }
    | { type: "USER" }
    | { type: "CHANNEL" }
    | { type: "ROLE" }
    | { type: "MENTIONABLE" }
  )

/**
 * A potential choice for a slash command option
 */
export type SlashCommandOptionDefinitionChoice<Value> = {
  name: string
  value: Value
}

type SlashCommandOptionValues<Options extends SlashCommandOptions> = {
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
  USER: Discord.User
  CHANNEL: Discord.GuildChannel
  ROLE: Discord.Role
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
      user: Discord.User

      /**
       * The guild (server) member object, if in a guild
       */
      guildMember: Discord.GuildMember | undefined
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
      role: Discord.Role
    }
)

/**
 * The interaction context for a slash command
 */
export type SlashCommandInteractionContext<
  Options extends SlashCommandOptions = SlashCommandOptions,
> = InteractionContext & {
  /**
   * An object of the options that were passed when running the slash command
   */
  options: SlashCommandOptionValues<Options>
}

/**
 * Valid slash command option config, only used for typescript inference
 */
export type SlashCommandOptions = {
  [name: string]: SlashCommandOptionDefinition
}

/**
 * Shared properties for all slash command option types
 */
export type SlashCommandOptionDefinitionBase = {
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

type SlashCommandDefinitionWithoutType<Options extends SlashCommandOptions> =
  OptionalKeys<SlashCommandDefinition<Options>, "__type">

const slashCommandType = Symbol("slashCommand")

/**
 * Define a slash command
 * ```js
 * const addUserCommand = defineSlashCommand({
 *   name: "add-user",
 *   description: "add user info",
 *   options: {
 *     name: {
 *       description: "name of the user",
 *       type: "STRING",
 *       required: true,
 *     },
 *     age: {
 *       description: "age of the user",
 *       type: "NUMBER",
 *     },
 *   },
 *   run(context) {
 *     const { name, age } = context.options
 *     context.reply(() => `Hello ${name}! Your age is ${age || "unknown"}`)
 *   },
 * })
 * gatekeeperInstance.addCommand(addUserCommand)
 * ```
 */
export function defineSlashCommand<Options extends SlashCommandOptions>(
  definition: SlashCommandDefinitionWithoutType<Options>,
): SlashCommandDefinition<Options> {
  return { ...definition, __type: slashCommandType }
}

/**
 * @internal
 */
export function isSlashCommandDefinition(
  definition: unknown,
): definition is SlashCommandDefinition<any> {
  return isAnyObject(definition) && definition.__type === slashCommandType
}

/**
 * @internal
 */
export function createSlashCommandContext(
  slashCommand: SlashCommandDefinition,
  interaction: Discord.CommandInteraction,
  logger: Logger,
): SlashCommandInteractionContext {
  const options = collectSlashCommandOptionValues(slashCommand, interaction)
  const actionQueue = createActionQueue(logger)
  return {
    ...createInteractionContext(interaction, logger, actionQueue),
    options,
  }
}

function collectSlashCommandOptionValues(
  slashCommand: SlashCommandDefinition<SlashCommandOptions>,
  interaction: Discord.CommandInteraction,
) {
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
      ) as Discord.GuildChannel | null

      options[name] =
        channel ?? optionFallback(name, optionDefinition, slashCommand)
    }

    if (optionDefinition.type === "ROLE") {
      const role = interaction.options.getRole(
        name,
        optionDefinition.required,
      ) as Discord.Role | null

      options[name] =
        role ?? optionFallback(name, optionDefinition, slashCommand)
    }

    if (optionDefinition.type === "MENTIONABLE") {
      const value = interaction.options.getMentionable(
        name,
        optionDefinition.required,
      ) as Discord.User | Discord.GuildMember | Discord.Role | null

      options[name] = value
        ? createResolvedMentionable(value)
        : optionFallback(name, optionDefinition, slashCommand)
    }
  }
  return options
}

function createResolvedMentionable(
  value: Discord.User | Discord.GuildMember | Discord.Role,
): SlashCommandMentionableValue {
  if (value instanceof Discord.User) {
    return {
      isUser: true,
      user: value,
      guildMember: undefined,
      mention: `<@!${value.id}>`,
    }
  }

  if (value instanceof Discord.GuildMember) {
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
  optionDefinition: SlashCommandOptionDefinition,
  slashCommand: SlashCommandDefinition<SlashCommandOptions>,
): string | number | boolean | undefined {
  return optionDefinition.required
    ? raise(
        `Could not get required option "${optionName}" for command "${slashCommand.name}"`,
      )
    : undefined
}
