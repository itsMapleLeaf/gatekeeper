import type * as Discord from "discord.js"
import { createActionQueue } from "../internal/action-queue"
import { isAnyObject } from "../internal/helpers"
import type { Logger } from "../internal/logger"
import type { OptionalKeys } from "../internal/types"
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

type SlashCommandOptionValues<Options extends SlashCommandOptions> = {
  [Name in keyof Options]: Options[Name]["required"] extends true
    ? SlashCommandOptionValueMap[Options[Name]["type"]]
    : SlashCommandOptionValueMap[Options[Name]["type"]] | undefined
}

type SlashCommandOptionValueMap = {
  STRING: string
  NUMBER: number
  INTEGER: number
  BOOLEAN: boolean
}

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

/**
 * A potential choice for a slash command option
 */
export type SlashCommandOptionDefinitionChoice<Value> = {
  name: string
  value: Value
}

export type SlashCommandOptionDefinition = SlashCommandOptionDefinitionBase &
  (
    | {
        /**
         * The type of the option, must be one of the following:
         * - `STRING`
         * - `NUMBER`
         * - `INTEGER`
         * - `BOOLEAN`
         */
        type: "STRING"

        /**
         * Potential choices for the option.
         * Use this to let the user choose from a list of values when running the command
         */
        choices?: SlashCommandOptionDefinitionChoice<string>[]
      }
    | {
        /**
         * The type of the option, must be one of the following:
         * - `STRING`
         * - `NUMBER`
         * - `INTEGER`
         * - `BOOLEAN`
         */
        type: "NUMBER" | "INTEGER"

        /**
         * Potential choices for the option.
         * Use this to let the user choose from a list of values when running the command
         */
        choices?: SlashCommandOptionDefinitionChoice<number>[]
      }
    | {
        /**
         * The type of the option, must be one of the following:
         * - `STRING`
         * - `NUMBER`
         * - `INTEGER`
         * - `BOOLEAN`
         */
        type: "BOOLEAN"
      }
  )

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
  const options: Record<string, string | number | boolean | undefined> = {}

  for (const [name, optionDefinition] of Object.entries(
    slashCommand.options ?? {},
  )) {
    const value = interaction.options.get(name, optionDefinition.required)
    if (!value) continue

    options[value.name] = value.value
  }

  const actionQueue = createActionQueue(logger)

  return {
    ...createInteractionContext(interaction, logger, actionQueue),
    options,
  }
}
