import type { Guild, GuildMember, TextBasedChannels, User } from "discord.js"
import type { DiscordInteraction } from "../internal/types"
import type { CommandInstance } from "./command"
import type { RenderReplyFn } from "./reply-component"

export type ReplyHandle = {
  refresh: () => void
  delete: () => void
}

export type InteractionContext = {
  readonly user: User
  readonly channel: TextBasedChannels | undefined
  readonly guild: Guild | undefined
  readonly guildMember: GuildMember | undefined
  reply: (render: RenderReplyFn) => ReplyHandle
  ephemeralReply: (render: RenderReplyFn) => void
  defer: () => void
  ephemeralDefer: () => void
}

export type InteractionContextInit = {
  interaction: DiscordInteraction
  command: CommandInstance
}

export function createInteractionContext({
  interaction,
  command,
}: InteractionContextInit): InteractionContext {
  return {
    user: interaction.user,
    channel: interaction.channel ?? undefined,
    guild: interaction.guild ?? undefined,
    guildMember: (interaction.member ?? undefined) as GuildMember | undefined,
    reply: (render: RenderReplyFn) => {
      const id = command.createReply(render, interaction)
      return {
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
