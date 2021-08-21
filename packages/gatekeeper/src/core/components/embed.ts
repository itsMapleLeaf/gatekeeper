import type { MessageEmbed, MessageEmbedOptions } from "discord.js"

export type EmbedComponent = ReturnType<typeof embedComponent>

export function embedComponent(embed: MessageEmbedOptions | MessageEmbed) {
  return { type: "embed", embed } as const
}
