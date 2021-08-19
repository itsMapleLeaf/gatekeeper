import type * as Discord from "discord.js"
import { isAnyObject } from "../internal/helpers"
import type { OptionalKeys } from "../internal/types"
import type { InteractionContext } from "./interaction-context"
import { createInteractionContext } from "./interaction-context"

export const slashCommandType = Symbol("slashCommand")

export type SlashCommandDefinition<
  Options extends SlashCommandOptions = SlashCommandOptions,
> = {
  __type: typeof slashCommandType
  name: string
  description: string
  options?: Options
  run: (
    context: SlashCommandInteractionContext<Options>,
  ) => void | Promise<unknown>
}

export type SlashCommandInteractionContext<
  Options extends SlashCommandOptions = SlashCommandOptions,
> = InteractionContext & {
  options: {
    [Name in keyof Options]: Options[Name]["required"] extends true
      ? SlashCommandOptionValueTypes[Options[Name]["type"]]
      : SlashCommandOptionValueTypes[Options[Name]["type"]] | undefined
  }
}

export type SlashCommandOptions = {
  [name: string]: SlashCommandOptionDefinition
}

export type SlashCommandOptionDefinition =
  | {
      type: "STRING"
      description: string
      required?: boolean
      choices?: { name: string; value: string }[]
    }
  | {
      type: "NUMBER" | "INTEGER"
      description: string
      required?: boolean
      choices?: { name: string; value: number }[]
    }
  | {
      type: "BOOLEAN"
      description: string
      required?: boolean
    }

export type SlashCommandOptionValueTypes = {
  STRING: string
  NUMBER: number
  INTEGER: number
  BOOLEAN: boolean
}

export type SlashCommandDefinitionWithoutType<
  Options extends SlashCommandOptions,
> = OptionalKeys<SlashCommandDefinition<Options>, "__type">

export function defineSlashCommand<Options extends SlashCommandOptions>(
  definition: SlashCommandDefinitionWithoutType<Options>,
): SlashCommandDefinition<Options> {
  return { ...definition, __type: slashCommandType }
}

export function isSlashCommandDefinition(
  definition: unknown,
): definition is SlashCommandDefinition<any> {
  return isAnyObject(definition) && definition.__type === slashCommandType
}

export function createSlashCommandContext(
  slashCommand: SlashCommandDefinition,
  interaction: Discord.CommandInteraction,
): SlashCommandInteractionContext {
  const options: Record<string, string | number | boolean | undefined> = {}

  for (const [name, optionDefinition] of Object.entries(
    slashCommand.options ?? {},
  )) {
    const value = interaction.options.get(name, optionDefinition.required)
    if (!value) continue

    options[value.name] = value.value
  }

  return {
    ...createInteractionContext(interaction),
    options,
  }
}
