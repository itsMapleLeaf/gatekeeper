import { defineMessageCommand } from "../../../gatekeeper/src/main"

export const spongebobCommand = defineMessageCommand({
  name: "spongebob",
  run(context) {
    context.reply(() =>
      [...context.targetMessage.content]
        .map((char, index) =>
          index % 2 === 0 ? char.toLocaleLowerCase() : char.toLocaleUpperCase(),
        )
        .join(""),
    )
  },
})
