import { actionRowComponent, buttonComponent } from "@itsmapleleaf/gatekeeper"

/**
 * @typedef {Object} Counter
 * @property {number} count
 */

/** @type {import("@itsmapleleaf/gatekeeper").CommandHandler} */
export const multiCounterCommand = {
  name: "multi-counter",
  description: "a counter on sterroids",
  async run(context) {
    /** @type {import("@itsmapleleaf/gatekeeper").CommandReplyHandle[]} */
    const replies = []

    // simple usage
    /** @type {'active' | 'cleaningUp' | 'done' | 'deleted'} */
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

        await new Promise((resolve) => setTimeout(resolve, 1000))

        state = "deleted"
        await reply.update()
      }

      if (state === "cleaningUp") {
        return ["cleaning up..."]
      }

      if (state === "done") {
        return ["done"]
      }

      if (state === "deleted") {
        return
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
}

/** @param {import("@itsmapleleaf/gatekeeper").CommandHandlerContext} context */
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
