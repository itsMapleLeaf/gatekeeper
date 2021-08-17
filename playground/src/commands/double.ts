import { defineSlashCommand } from "../../../gatekeeper/src/main"

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
  async run(context) {
    const { number } = context.options
    await context.createReply(() => `${number} × 2 = **${number * 2}**`)
  },
})
