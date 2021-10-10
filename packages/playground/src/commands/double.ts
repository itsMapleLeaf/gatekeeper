import { Gatekeeper } from "@itsmapleleaf/gatekeeper/src/main"

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "double",
    description: "doubles a number",
    options: {
      number: {
        type: "NUMBER",
        description: "the number to double",
        required: true,
      },
    },
    run(context) {
      const { number } = context.options
      context.reply(() => `${number} × 2 = **${number * 2}**`)
    },
  });
}
