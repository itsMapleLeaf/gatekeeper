import type { MessageSelectOptionData } from "discord.js"
import { randomUUID } from "node:crypto"
import type { MessageComponentInteractionContext } from "../interaction-context"

export type SelectMenuComponent<State> = {
  type: "selectMenu"
  customId: string
  options: MessageSelectOptionData[]
  placeholder?: string | undefined
  minValues?: number | undefined
  maxValues?: number | undefined
  onSelect: (
    context: SelectInteractionContext<State>,
  ) => void | Promise<unknown>
}

export type SelectInteractionContext<State> =
  MessageComponentInteractionContext<State> & { values: string[] }

export function selectMenuComponent<State>({
  options,
  selected,
  ...args
}: {
  options: MessageSelectOptionData[]
  selected?: Iterable<string> | string | undefined
  placeholder?: string | undefined
  minValues?: number | undefined
  maxValues?: number | undefined
  onSelect: (
    context: SelectInteractionContext<State>,
  ) => void | Promise<unknown>
}): SelectMenuComponent<State> {
  const selectedOptions =
    typeof selected === "string"
      ? new Set([selected])
      : selected != null
      ? new Set(selected)
      : new Set()

  return {
    ...args,
    type: "selectMenu",
    customId: randomUUID(),
    options: options.map((option) => ({
      ...option,
      default: option.default ?? selectedOptions.has(option.value),
    })),
  }
}
