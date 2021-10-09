import type { Guild, GuildMember, TextBasedChannels, User } from "discord.js"
import type { DiscordInteraction } from "../internal/types"
import type { CommandInstance } from "./command"
import type { RenderReplyFn } from "./reply-component"

export type ReplyHandle = {
  refresh: () => void
  delete: () => void
}

export class InteractionContext {
  constructor(
    protected readonly interaction: DiscordInteraction,
    protected readonly commandInstance: CommandInstance,
  ) {}

  get user(): User {
    return this.interaction.user
  }

  get channel(): TextBasedChannels | undefined {
    return this.interaction.channel ?? undefined
  }

  get guild(): Guild | undefined {
    return this.interaction.guild ?? undefined
  }

  get guildMember(): GuildMember | undefined {
    return (this.interaction.member ?? undefined) as GuildMember | undefined
  }

  reply(render: RenderReplyFn): ReplyHandle {
    const id = this.commandInstance.createReply(render, this.interaction)
    return {
      refresh: () => {
        this.commandInstance.refreshReply(id)
      },
      delete: () => {
        this.commandInstance.deleteReply(id)
      },
    }
  }

  ephemeralReply(render: RenderReplyFn) {
    this.commandInstance.createEphemeralReply(render, this.interaction)
  }

  defer() {
    this.commandInstance.defer(this.interaction)
  }

  ephemeralDefer() {
    this.commandInstance.ephemeralDefer(this.interaction)
  }
}
