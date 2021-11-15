import type { Gatekeeper } from "@itsmapleleaf/gatekeeper/src/main"

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "channel-types",
    description: "Test channel types",
    options: {
      "text": {
        type: "CHANNEL",
        description: "A text channel",
        channelTypes: ["GUILD_TEXT"],
      },
      "voice": {
        type: "CHANNEL",
        description: "A voice channel",
        channelTypes: ["GUILD_VOICE"],
      },
      "text-voice": {
        type: "CHANNEL",
        description: "A voice channel",
        channelTypes: ["GUILD_TEXT", "GUILD_VOICE"],
      },
      "category": {
        type: "CHANNEL",
        description: "A category",
        channelTypes: ["GUILD_CATEGORY"],
      },
      "any": {
        type: "CHANNEL",
        description: "Any channel",
      },
    },
    run(context) {
      const { any, category, text, voice } = context.options

      const selection = [
        any?.name,
        category?.name,
        text?.name,
        voice?.name,
      ].filter((s) => !!s)

      context.reply(() => `You selected ${selection}`)
    },
  })
}
