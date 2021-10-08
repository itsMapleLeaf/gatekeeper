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

  ephemeralReply(render: RenderReplyFn): void {
    this.commandInstance.createEphemeralReply(render, this.interaction)
  }
}
