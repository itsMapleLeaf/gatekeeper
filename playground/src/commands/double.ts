import type { Gatekeeper } from "@itsmapleleaf/gatekeeper/src/main"

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "double",
    description: "doubles a number",
    options: {
      number: {
        type: "NUMBER",
        description: "the number to double",
        required: true,
        choices: [],
      },
      strawberry: {
        type: "BOOLEAN",
        description: "add a strawberry",
      },
    },
    run(context) {
      const { number, strawberry } = context.options
      context.reply(() => [
        `${number} × 2 = **${number * 2}**`,
        strawberry && "🍓",
      ])
    },
  })
}
