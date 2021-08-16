import type { EmojiResolvable, MessageButtonStyle } from "discord.js"
import { randomUUID } from "node:crypto"

export type ButtonComponent = {
  type: "button"
  customId: string
  style: MessageButtonStyle
  label: string
  emoji?: EmojiResolvable
  onClick: () => void | Promise<unknown>
}

export function buttonComponent(
  options: Omit<ButtonComponent, "type" | "customId">,
): ButtonComponent {
  return {
    ...options,
    type: "button",
    customId: randomUUID(),
  }
}
