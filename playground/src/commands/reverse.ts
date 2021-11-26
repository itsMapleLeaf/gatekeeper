import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addMessageCommand({
    name: "reverse message content",
    run(context) {
      context.reply(() =>
        context.targetMessage.content.split("").reverse().join(""),
      )
    },
  })
}
