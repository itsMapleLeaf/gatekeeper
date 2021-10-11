import type { Gatekeeper } from "@itsmapleleaf/gatekeeper/src/main"

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "choices",
    description: "choose things",
    options: {
      color: {
        type: "STRING",
        description: "pick a color",
        required: true,
        choices: [
          { name: "🔴 Red", value: "red" },
          { name: "🔵 Blue", value: "blue" },
          { name: "🟢 Green", value: "green" },
        ],
      },
      number: {
        type: "NUMBER",
        description: "pick a number",
        required: true,
        choices: [
          { name: "1️⃣ One", value: 1 },
          { name: "2️⃣ Two", value: 2 },
          { name: "3️⃣ Three", value: 3 },
          { name: "4️⃣ Four", value: 4 },
          { name: "5️⃣ Five", value: 5 },
        ],
      },
    },
    run(context) {
      context.reply(
        () =>
          `you picked ${context.options.color} and ${context.options.number}`,
      )
    },
  })
}
