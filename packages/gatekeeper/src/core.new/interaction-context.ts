import type { RenderReplyFn } from "./reply-component"

export type ReplyHandle = {
  refresh: () => void
  delete: () => void
}

export type InteractionContext = {
  reply: (render: RenderReplyFn) => ReplyHandle
}
