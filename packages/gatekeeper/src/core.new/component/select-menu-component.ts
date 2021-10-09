import { randomUUID } from "crypto"
import type { Message, MessageSelectOptionData } from "discord.js"
import type { InteractionContext } from "../interaction-context"

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
   * The currently selected option value(s).
   * This accepts `Iterable`, so you can pass an array, a Set,
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
  onSelect: (context: SelectMenuInteractionContext) => void | Promise<unknown>

  /**
   * The minimum number of options that can be selected.
   * Passing this option will enable multi-select,
   * and can't be 0.
   */
  minValues?: number | undefined

  /**
   * The maximum number of options that can be selected.
   * Passing this option will enable multi-select,
   * and can't be greater than the number of options.
   */
  maxValues?: number | undefined
}

/**
 * Returned from {@link selectMenuComponent}
 */
export type SelectMenuComponent = Omit<
  SelectMenuComponentOptions,
  "selected"
> & {
  type: "selectMenu"
  customId: string
}

export type SelectMenuInteractionContext = InteractionContext & {
  readonly message: Message
  readonly values: string[]
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
