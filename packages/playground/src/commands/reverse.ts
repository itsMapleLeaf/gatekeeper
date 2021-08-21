import { defineMessageCommand } from "../../../gatekeeper/src/main"

export const reverseCommand = defineMessageCommand({
  name: "reverse",
  run(context) {
    context.reply(() =>
      context.targetMessage.content.split("").reverse().join(""),
    )
  },
})
