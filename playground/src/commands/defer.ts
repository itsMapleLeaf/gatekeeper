import { defineSlashCommand } from "../../../gatekeeper/src/main"
import { wait } from "../wait"

export const deferCommand = defineSlashCommand({
  name: "defer",
  description: "test deferring",
  async run(context) {
    context.defer()
    await wait(4000)
    context.reply(() => `done! here's a cookie 🍪`)
  },
})
