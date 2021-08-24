import { randomUUID } from "crypto"
import type { EmojiResolvable, MessageButtonStyle } from "discord.js"
import type { InteractionContext } from "./interaction-context"

/**
 * Returned from {@link buttonComponent}
 */
export type ButtonComponent = {
  type: "button"
  customId: string
  style: MessageButtonStyle
  label: string
  emoji?: EmojiResolvable
  onClick: (context: InteractionContext) => void
}

/**
 * The context object received by button onClick handlers. See {@link buttonComponent}
 */
export type ButtonInteractionContext = InteractionContext

/**
 * Options for {@link buttonComponent}
 */
export type ButtonComponentOptions = {
  /**
   * The text to display on the button
   */
  label: string

  /**
   * The color and intent of the button.
   * @see https://discord.js.org/#/docs/main/stable/typedef/MessageButtonStyle
   */
  style: MessageButtonStyle

  /**
   * An emoji displayed on the left of the button.
   * @see https://discord.js.org/#/docs/main/stable/typedef/EmojiResolvable
   */
  emoji?: EmojiResolvable

  /**
   * Called when the button is clicked
   */
  onClick: (context: ButtonInteractionContext) => void
}

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
