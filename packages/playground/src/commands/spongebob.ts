import { Gatekeeper } from "@itsmapleleaf/gatekeeper/src/main";

function spongebobify(text: string): string {
  return [...text]
    .map((char, index) =>
      index % 2 === 0 ? char.toLocaleLowerCase() : char.toLocaleUpperCase(),
    )
    .join("")
}

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addMessageCommand({
    name: "spongebob",
    run(context) {
      context.reply(() => spongebobify(context.targetMessage.content))
    },
  });

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
  });
}
