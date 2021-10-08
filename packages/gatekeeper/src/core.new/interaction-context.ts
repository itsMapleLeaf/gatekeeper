import type { RenderReplyFn } from "./reply-component"

export type ReplyHandle = {
  refresh: () => void
  delete: () => void
}

export class InteractionContext {
  reply(render: RenderReplyFn) {}
}
