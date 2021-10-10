import { defineSlashCommand } from "@itsmapleleaf/gatekeeper/src/main"

export const doubleCommand = defineSlashCommand({
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
})
