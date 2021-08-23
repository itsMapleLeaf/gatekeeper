import {
  defineMessageCommand,
  defineSlashCommand,
} from "../../../gatekeeper/src/main"

function spongebobify(text: string): string {
  return [...text]
    .map((char, index) =>
      index % 2 === 0 ? char.toLocaleLowerCase() : char.toLocaleUpperCase(),
    )
    .join("")
}

// this defines a context menu command when you right-click on a message
export const spongebobMessageCommand = defineMessageCommand({
  name: "spongebob",
  run(context) {
    context.reply(() => spongebobify(context.targetMessage.content))
  },
})

export const spongebobSlashCommand = defineSlashCommand({
  name: "spongebob",
  description: "sUrE yOu dId",
  options: {
    text: {
      type: "STRING",
      description: "iT's hTe tExT",
      required: true,
    },
  },
  run(context) {
    context.reply(() => spongebobify(context.options.text))
  },
})
