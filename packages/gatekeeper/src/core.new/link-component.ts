import type { EmojiResolvable } from "discord.js"

/**
 * Options for the link component
 * @see linkComponent
 */
export type LinkComponentOptions = {
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
   * The URL to open when the button is clicked
   */
  url: string
}

/**
 * Returned from {@link linkComponent}
 */
export type LinkComponent = LinkComponentOptions & {
  type: "link"
}

export function linkComponent(options: LinkComponentOptions): LinkComponent {
  return {
    ...options,
    type: "link",
  }
}
