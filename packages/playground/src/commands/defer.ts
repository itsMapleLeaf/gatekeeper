import {
  buttonComponent,
  defineSlashCommand,
} from "../../../gatekeeper/src/main"
import { wait } from "../wait"

// if a command can potentially take a while, deferring it can be a good idea!
//
// deferring will show a "loading" message in discord
// until another reply is made
//
// for buttons and selects, deferring doesn't do anything (at the moment)
export const deferCommand = defineSlashCommand({
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
