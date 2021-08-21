import type { EmojiResolvable, MessageButtonStyle } from "discord.js"
import { randomUUID } from "node:crypto"
import type { InteractionContext } from "../interaction-context"

export type ButtonComponent = {
  type: "button"
  customId: string
  style: MessageButtonStyle
  label: string
  emoji?: EmojiResolvable
  onClick: (context: InteractionContext) => void
}

export type ButtonInteractionContext = InteractionContext

export function buttonComponent(
  options: Omit<ButtonComponent, "type" | "customId">,
): ButtonComponent {
  return {
    ...options,
    type: "button",
    customId: randomUUID(),
  }
}
