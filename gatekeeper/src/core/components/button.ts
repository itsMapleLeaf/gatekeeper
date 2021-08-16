import type { EmojiResolvable, MessageButtonStyle } from "discord.js"
import { randomUUID } from "node:crypto"
import type { BaseEvent } from "../reply-component"

export type ButtonComponent = {
  type: "button"
  customId: string
  style: MessageButtonStyle
  label: string
  emoji?: EmojiResolvable
  onClick: (event: ClickEvent) => void | Promise<unknown>
}

export type ClickEvent = BaseEvent

export function buttonComponent(
  options: Omit<ButtonComponent, "type" | "customId">,
): ButtonComponent {
  return {
    ...options,
    type: "button",
    customId: randomUUID(),
  }
}
