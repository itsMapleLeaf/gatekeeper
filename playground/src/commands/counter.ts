import {
  actionRowComponent,
  buttonComponent,
  defineSlashCommand,
} from "@itsmapleleaf/gatekeeper"
import { wait } from "../wait"

export const counterCommand = defineSlashCommand({
  name: "counter",
  description: "make a counter",
  async run(context) {
    let count = 0
    let state = "running"

    const reply = await context.createReply(() => {
      if (state === "done") {
        return ["well fine then"]
      }

      return [
        `button pressed ${count} times`,
        actionRowComponent(
          buttonComponent({
            style: "PRIMARY",
            label: "press it",
            onClick: () => {
              count += 1
            },
          }),
          buttonComponent({
            style: "PRIMARY",
            label: "i'm bored",
            onClick: async () => {
              state = "done"
              await reply.update()
              await wait(1000)
              await reply.delete()
            },
          }),
        ),
      ]
    })
  },
})
