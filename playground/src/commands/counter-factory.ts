import type { InteractionContext } from "../../../gatekeeper/src/core/interaction-context"
import {
  actionRowComponent,
  buttonComponent,
  defineSlashCommand,
} from "../../../gatekeeper/src/main"
import { wait } from "../wait"

export const counterFactory = defineSlashCommand({
  name: "counter-factory",
  description: "a counter on sterroids",
  run(context) {
    const replies: { refresh: () => void; delete: () => void }[] = []

    let state: "active" | "cleaningUp" | "done" = "active"
    const reply = context.reply(() => {
      const cleanup = async () => {
        state = "cleaningUp"
        reply.refresh()

        for (const counterReply of replies) {
          counterReply.delete()
        }

        await wait(1000)

        state = "done"
        reply.refresh()

        await wait(1000)
        reply.delete()
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
            onClick: () => {
              replies.push(createCounterReply(context))
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

function createCounterReply(context: InteractionContext) {
  let count = 0

  const reply = context.reply(() => {
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
            reply.delete()
          },
        }),
      ),
    ]
  })
  return reply
}
