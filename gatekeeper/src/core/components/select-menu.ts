import type { MessageSelectOptionData } from "discord.js"
import { randomUUID } from "node:crypto"
import type { BaseEvent } from "../reply-component"

export type SelectMenuComponent = ReturnType<typeof selectMenuComponent>

export type SelectEvent = BaseEvent & {
  values: string[]
}

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
  onSelect: (event: SelectEvent) => void | Promise<unknown>
}) {
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
  } as const
}
