import { randomUUID } from "crypto"
import type { MessageSelectOptionData } from "discord.js"
import type { InteractionContext } from "../interaction-context"

export type SelectMenuComponent = {
  type: "selectMenu"
  customId: string
  options: MessageSelectOptionData[]
  placeholder?: string | undefined
  minValues?: number | undefined
  maxValues?: number | undefined
  onSelect: (context: SelectInteractionContext) => void
}

export type SelectInteractionContext = InteractionContext & { values: string[] }

export function selectMenuComponent({
  options,
  selected,
  ...args
}: {
  options: MessageSelectOptionData[]
  selected?: Iterable<string> | string | undefined
  placeholder?: string | undefined
  minValues?: number | undefined
  maxValues?: number | undefined
  onSelect: (context: SelectInteractionContext) => void
}): SelectMenuComponent {
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
