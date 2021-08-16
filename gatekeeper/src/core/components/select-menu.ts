import type { MessageSelectOptionData } from "discord.js"
import { randomUUID } from "node:crypto"

export type SelectMenuComponent = ReturnType<typeof selectMenuComponent>

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
  onSelect: (values: string[]) => void | Promise<unknown>
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
