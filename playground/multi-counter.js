import { actionRowComponent, buttonComponent } from "@itsmapleleaf/gatekeeper"

/**
 * @typedef {Object} Counter
 * @property {number} count
 */

/** @type {import("@itsmapleleaf/gatekeeper").CommandHandler} */
export const multiCounterCommand = {
  name: "multicounter",
  description: "a counter on sterroids",
  async run(context) {
    /** @type {import("@itsmapleleaf/gatekeeper").CommandReplyHandle[]} */
    const replies = []

    // simple usage
    let finished = false
    await context.createReply(() => {
      if (finished) {
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
            onClick: async () => {
              for (const reply of replies) {
                await reply.delete()
              }
              finished = true
            },
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
