import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { buttonComponent } from "@itsmapleleaf/gatekeeper"
import { setTimeout } from "node:timers/promises"

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "defer",
    description: "test deferring",
    async run(context) {
      context.defer()

      await setTimeout(4000)

      context.reply(() =>
        buttonComponent({
          label: "",
          emoji: "🍪",
          style: "SECONDARY",
          onClick: async (context) => {
            context.defer()
            await setTimeout(4000)
            context.ephemeralReply(
              () => `thanks for waiting, here's your cookie! 🍪`,
            )
          },
        }),
      )
    },
  })
}
