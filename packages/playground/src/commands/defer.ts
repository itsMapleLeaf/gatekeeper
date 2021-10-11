import type { Gatekeeper } from "@itsmapleleaf/gatekeeper/src/main"
import { buttonComponent } from "@itsmapleleaf/gatekeeper/src/main"
import { wait } from "../wait"

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "defer",
    description: "test deferring",
    async run(context) {
      context.defer()

      await wait(4000)

      context.reply(() =>
        buttonComponent({
          label: "",
          emoji: "🍪",
          style: "SECONDARY",
          onClick: async (context) => {
            context.defer()
            await wait(4000)
            context.ephemeralReply(
              () => `thanks for waiting, here's your cookie! 🍪`,
            )
          },
        }),
      )
    },
  })
}
