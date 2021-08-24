import { randomUUID } from "crypto"
import type { MessageSelectOptionData } from "discord.js"
import type { InteractionContext } from "./interaction-context"

/**
 * Returned from {@link selectMenuComponent}
 */
export type SelectMenuComponent = {
  type: "selectMenu"
  customId: string
  options: MessageSelectOptionData[]
  placeholder?: string | undefined
  minValues?: number | undefined
  maxValues?: number | undefined
  onSelect: (context: SelectInteractionContext) => void
}

/**
 * Passed to the select menu `onSelect` function
 */
export type SelectInteractionContext = InteractionContext & {
  /**
   * The values that the user selected.
   * Use this to update your current selected state.
   * @see selectMenuComponent
   */
  values: string[]
}

/**
 * Options passed to {@link selectMenuComponent}
 */
export type SelectMenuComponentOptions = {
  /**
   * The array of options that can be selected.
   * Same structure as [MessageSelectOptionData from DJS](https://discord.js.org/#/docs/main/stable/typedef/MessageSelectOptionData)
   * @see selectMenuComponent
   */
  options: MessageSelectOptionData[]

  /**
   * The currently selected option values.
   * This accepts `Iterable`, so you can pass an array, a Set, a Map,
   * or any other kind of iterable.
   * @see selectMenuComponent
   */
  selected?: Iterable<string> | string | undefined

  /** The placeholder text to display when no options are selected */
  placeholder?: string | undefined

  /**
   * Called when one or more options are selected.
   * Use this callback to update your current selected state.
   *
   * **Note:** For multi-select ({@link SelectMenuComponentOptions.maxValues}), this doesn't get called immediately.
   * It only gets called after clicking away from the select dropdown.
   *
   * @see selectMenuComponent
   */
  onSelect: (context: SelectInteractionContext) => void

  /**
   * The minimum number of options that can be selected.
   */
  minValues?: number | undefined

  /**
   * The maximum number of options that can be selected.
   * Passing thiss option will enable multi-select,
   * and can't be greater than the number of options.
   */
  maxValues?: number | undefined
}

/**
 * Represents a Discord [select menu](https://discord.com/developers/docs/interactions/message-components#select-menus) component.
 *
 * ```js
 * let selected
 *
 * context.reply(() =>
 *   selectMenuComponent({
 *     options: [
 *       { label: "option 1", value: "option 1" },
 *       { label: "option 2", value: "option 2" },
 *     ],
 *     placeholder: "select one",
 *     selected,
 *     onChange: (values) => {
 *       selected = values[0]
 *     },
 *   }),
 * )
 * ```
 */
export function selectMenuComponent({
  options,
  selected,
  ...args
}: SelectMenuComponentOptions): SelectMenuComponent {
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
