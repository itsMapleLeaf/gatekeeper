import {
  actionRowComponent,
  buttonComponent,
  defineSlashCommand,
} from "../../../gatekeeper/src/main"
import { wait } from "../wait"

export const deferCommand = defineSlashCommand({
  name: "defer",
  description: "test deferring",
  async run(context) {
    context.defer()

    await wait(4000)

    context.reply(() =>
      actionRowComponent(
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
      ),
    )
  },
})
