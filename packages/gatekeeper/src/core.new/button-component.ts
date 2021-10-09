import { randomUUID } from "crypto"
import type {
  ButtonInteraction,
  EmojiResolvable,
  Message,
  MessageButtonStyle,
} from "discord.js"
import type { CommandInstance } from "./command"
import { InteractionContext } from "./interaction-context"

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
  onClick: (context: ButtonInteractionContext) => void | Promise<unknown>
}

/**
 * Returned from {@link buttonComponent}
 */
export type ButtonComponent = ButtonComponentOptions & {
  type: "button"
  customId: string
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

/**
 * The context object received by button onClick handlers.
 * @see buttonComponent
 */
export class ButtonInteractionContext extends InteractionContext {
  protected readonly interaction: ButtonInteraction

  constructor(
    interaction: ButtonInteraction,
    commandInstance: CommandInstance,
  ) {
    super(interaction, commandInstance)
    this.interaction = interaction
  }

  get message(): Message {
    return this.interaction.message as Message
  }
}
