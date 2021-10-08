import type { RenderReplyFn } from "./reply-component"

export type InteractionContext = {
  reply: (render: RenderReplyFn) => ReplyHandle
}

export type ReplyHandle = {
  refresh: () => void
  delete: () => void
}
