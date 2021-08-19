import type { EmojiResolvable, MessageButtonStyle } from "discord.js"
import { randomUUID } from "node:crypto"
import type { InteractionContext } from "../interaction-context"

export type ButtonComponent<State> = {
  type: "button"
  customId: string
  style: MessageButtonStyle
  label: string
  emoji?: EmojiResolvable
  onClick: (context: ButtonInteractionContext<State>) => void | Promise<unknown>
}

export type ButtonInteractionContext<State> = InteractionContext & {
  setState: (update: (prev: State) => State) => Promise<void>
}

export function buttonComponent<State>(
  options: Omit<ButtonComponent<State>, "type" | "customId">,
): ButtonComponent<State> {
  return {
    ...options,
    type: "button",
    customId: randomUUID(),
  }
}
