import {
  actionRowComponent,
  buttonComponent,
  defineSlashCommand,
} from "@itsmapleleaf/gatekeeper"
import { wait } from "../wait.js"

export const multiCounterCommand = defineSlashCommand({
  name: "multi-counter",
  description: "a counter on sterroids",
  async run(context) {
    /** @type {import("@itsmapleleaf/gatekeeper").SlashCommandReplyHandle[]} */
    const replies = []

    /** @type {'active' | 'cleaningUp' | 'done'} */
    let state = "active"
    const reply = await context.createReply(() => {
      const cleanup = async () => {
        state = "cleaningUp"
        await reply.update()

        for (const counterReply of replies) {
          await counterReply.delete()
        }

        state = "done"
        await reply.update()

        await wait(1000)
        await reply.delete()
      }

      if (state === "cleaningUp") {
        return ["cleaning up..."]
      }

      if (state === "done") {
        return ["done"]
      }

      return [
        actionRowComponent(
          buttonComponent({
            label: "create counter",
            style: "PRIMARY",
            onClick: async () => {
              replies.push(await createCounterReply(context))
            },
          }),
          buttonComponent({
            label: "clean up",
            style: "SECONDARY",
            onClick: cleanup,
          }),
        ),
      ]
    })
  },
})

/** @param {import("@itsmapleleaf/gatekeeper").SlashCommandContext<any>} context */
async function createCounterReply(context) {
  let count = 0
  let finished = false

  return context.createReply(() => {
    if (finished) {
      return
    }

    return [
      actionRowComponent(
        buttonComponent({
          label: `increment (${count})`,
          style: "PRIMARY",
          onClick: () => {
            count++
          },
        }),
        buttonComponent({
          label: "done",
          style: "SECONDARY",
          onClick: () => {
            finished = true
          },
        }),
      ),
    ]
  })
}
