import type { MessageEmbed, MessageEmbedOptions } from "discord.js"

/**
 * Returned from {@link embedComponent}
 */
export type EmbedComponent = {
  type: "embed"
  embed: MessageEmbed | MessageEmbedOptions
}

/**
 * Creates an embed component.
 * Accepts {@link https://discord.js.org/#/docs/main/stable/typedef/MessageEmbedOptions MessageEmbedOptions}, or a DJS {@link https://discord.js.org/#/docs/main/stable/class/MessageEmbed MessageEmbed} instance.
 *
 * ```js
 * context.reply(() => [
 *   embedComponent({
 *     title: "Your weather today 🌤",
 *     description: `Sunny, with a 12% chance of rain`,
 *     footer: {
 *       text: "Sourced from https://openweathermap.org/",
 *     },
 *   }),
 * ])
 * ```
 */
export function embedComponent(
  embed: MessageEmbedOptions | MessageEmbed,
): EmbedComponent {
  return { type: "embed", embed }
}
