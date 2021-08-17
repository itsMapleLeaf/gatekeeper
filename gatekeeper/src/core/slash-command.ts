import type { Guild, GuildMember, TextBasedChannels, User } from "discord.js"
import { isAnyObject } from "../internal/helpers"
import type { OptionalKeys } from "../internal/types"
import type { RenderReplyFn } from "./reply-component"

export const slashCommandType = Symbol("slashCommand")

export type SlashCommandDefinition<
  Options extends SlashCommandOptions = SlashCommandOptions,
> = {
  __type: typeof slashCommandType
  name: string
  description: string
  options?: Options
  run: (context: SlashCommandContext<Options>) => void | Promise<unknown>
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

export type SlashCommandContext<Options extends SlashCommandOptions> = {
  channel: TextBasedChannels | undefined
  member: GuildMember | undefined
  user: User
  guild: Guild | undefined
  options: {
    [Name in keyof Options]: Options[Name]["required"] extends true
      ? SlashCommandOptionValueTypes[Options[Name]["type"]]
      : SlashCommandOptionValueTypes[Options[Name]["type"]] | undefined
  }

  createReply: (render: RenderReplyFn) => Promise<SlashCommandReplyHandle>

  createEphemeralReply: (
    render: RenderReplyFn,
  ) => Promise<SlashCommandEphemeralReplyHandle>
}

export type SlashCommandEphemeralReplyHandle = {
  update: () => Promise<void>
}

export type SlashCommandReplyHandle = SlashCommandEphemeralReplyHandle & {
  delete: () => Promise<void>
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
