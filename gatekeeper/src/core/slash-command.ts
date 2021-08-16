import type { GuildMember } from "discord.js"
import type { RenderReplyFn } from "./reply-component"

export type SlashCommandDefinition<
  Options extends SlashCommandOptions = SlashCommandOptions,
> = {
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
  member: GuildMember | undefined
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

export function defineSlashCommand<Options extends SlashCommandOptions>(
  slashCommand: SlashCommandDefinition<Options>,
) {
  return slashCommand
}
