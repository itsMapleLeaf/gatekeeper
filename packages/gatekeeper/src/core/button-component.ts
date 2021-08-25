import { randomUUID } from "crypto"
import type { EmojiResolvable, MessageButtonStyle } from "discord.js"
import type { InteractionContext } from "./interaction-context"

/**
 * Options for {@link buttonComponent}
 */
export type ButtonComponentOptions = {
  /**
   * The text to display on the button
   */
  label: string

  /**
   * An emoji displayed on the button.
   * If you only want to show an emoji, pass an empty string for the label.
   * @see https://discord.js.org/#/docs/main/stable/typedef/EmojiResolvable
   */
  emoji?: EmojiResolvable

  /**
   * The color and intent of the button.
   * @see https://discord.js.org/#/docs/main/stable/typedef/MessageButtonStyle
   */
  style: Exclude<MessageButtonStyle, "LINK">

  /**
   * Whether the button is disabled.
   * This can be anti-accessibility, so consider an alternative,
   * like showing an error on click, or hiding the button entirely.
   */
  disabled?: boolean

  /**
   * Called when the button is clicked
   */
  onClick: (context: ButtonInteractionContext) => void
}

/**
 * Returned from {@link buttonComponent}
 */
export type ButtonComponent = ButtonComponentOptions & {
  type: "button"
  customId: string
}

/**
 * The context object received by button onClick handlers.
 * @see buttonComponent
 */
export type ButtonInteractionContext = InteractionContext

/**
 * Represents a discord [button](https://discord.com/developers/docs/interactions/message-components#buttons) component.
 * Does not support URL or disabled props yet.
 *
 * ```js
 * context.reply(() => (
 *   buttonComponent({
 *     label: "Click me!",
 *     onClick: context => {
 *       context.reply(() => "You clicked me!"),
 *     },
 *   }),
 * ))
 * ```
 */
export function buttonComponent(
  options: ButtonComponentOptions,
): ButtonComponent {
  return {
    ...options,
    type: "button",
    customId: randomUUID(),
  }
}
