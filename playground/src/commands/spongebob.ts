import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"

function spongebobify(text: string): string {
  return [...(text || "no message content")]
    .map((char, index) =>
      index % 2 === 0 ? char.toLocaleLowerCase() : char.toLocaleUpperCase(),
    )
    .join("")
}

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addMessageCommand({
    name: "spongebob",
    aliases: ["sb"],
    run(context) {
      context.reply(() => spongebobify(context.targetMessage.content))
    },
  })

  gatekeeper.addSlashCommand({
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
}
