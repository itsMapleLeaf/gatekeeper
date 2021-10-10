import { defineMessageCommand } from "@itsmapleleaf/gatekeeper/src/main"

export const reverseCommand = defineMessageCommand({
  name: "reverse message content",
  run(context) {
    context.reply(() =>
      context.targetMessage.content.split("").reverse().join(""),
    )
  },
})
