import type { GuildMember } from "discord.js"
import type { ReplyComponentArgs } from "./reply-component.js"

export type ComponentInteraction = {
  customId: string
  values: string[]
  defer: () => Promise<void>
}

export type CommandHandler = {
  name: string
  description: string
  run: (context: CommandHandlerContext) => void | Promise<unknown>
}

export type CommandHandlerContext = {
  member: GuildMember
  addReply: (...components: ReplyComponentArgs) => Promise<CommandReply>
  addEphemeralReply: (
    ...components: ReplyComponentArgs
  ) => Promise<EphemeralCommandReply>
  defer: () => Promise<CommandReply>
  waitForInteraction: () => Promise<ComponentInteraction | undefined>
}

export type EphemeralCommandReply = {
  edit: (...components: ReplyComponentArgs) => Promise<void>
}

export type CommandReply = EphemeralCommandReply & {
  delete: () => Promise<void>
}
