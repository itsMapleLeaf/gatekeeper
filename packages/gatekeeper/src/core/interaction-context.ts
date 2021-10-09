import type {
  Guild,
  GuildMember,
  Message,
  TextBasedChannels,
  User,
} from "discord.js"
import type { DiscordInteraction } from "../internal/types"
import type { CommandInstance } from "./command/command"
import type { RenderReplyFn } from "./component/reply-component"

export type ReplyHandle = {
  get message(): Message | undefined
  readonly refresh: () => void
  readonly delete: () => void
}

export type InteractionContext = {
  readonly user: User
  readonly channel: TextBasedChannels | undefined
  readonly guild: Guild | undefined
  readonly guildMember: GuildMember | undefined
  readonly reply: (render: RenderReplyFn) => ReplyHandle
  readonly ephemeralReply: (render: RenderReplyFn) => void
  readonly defer: () => void
  readonly ephemeralDefer: () => void
}

export function createInteractionContext({
  interaction,
  command,
}: {
  interaction: DiscordInteraction
  command: CommandInstance
}): InteractionContext {
  return {
    user: interaction.user,
    channel: interaction.channel ?? undefined,
    guild: interaction.guild ?? undefined,
    guildMember: (interaction.member ?? undefined) as GuildMember | undefined,
    reply: (render: RenderReplyFn) => {
      const id = command.createReply(render, interaction)
      return {
        get message() {
          return command.getReplyMessage(id)
        },
        refresh: () => {
          command.refreshReply(id)
        },
        delete: () => {
          command.deleteReply(id)
        },
      }
    },
    ephemeralReply: (render: RenderReplyFn) => {
      command.createEphemeralReply(render, interaction)
    },
    defer: () => {
      command.defer(interaction)
    },
    ephemeralDefer: () => {
      command.ephemeralDefer(interaction)
    },
  }
}
