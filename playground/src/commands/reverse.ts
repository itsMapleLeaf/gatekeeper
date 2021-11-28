import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addMessageCommand({
    name: "reverse message content",
    aliases: ["rev"],
    run(context) {
      context.reply(() =>
        (context.targetMessage.content || "no message content")
          .split("")
          .reverse()
          .join(""),
      )
    },
  })
}
