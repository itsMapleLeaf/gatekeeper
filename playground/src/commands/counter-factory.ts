import type {
  Gatekeeper,
  InteractionContext,
  ReplyHandle,
} from "@itsmapleleaf/gatekeeper"
import { buttonComponent } from "@itsmapleleaf/gatekeeper"
import { setTimeout } from "node:timers/promises"

function createCounterReply(context: InteractionContext) {
  let count = 0

  const reply = context.reply(() => {
    return [
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
    ]
  })
  return reply
}

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "counter-factory",
    description: "a counter on sterroids",
    run(context) {
      const replies: ReplyHandle[] = []

      let state: "active" | "cleaningUp" | "done" = "active"
      const reply = context.reply(() => {
        const cleanup = async () => {
          state = "cleaningUp"
          reply.refresh()

          for (const counterReply of replies) {
            counterReply.delete()
          }

          await setTimeout(1000)

          state = "done"
          reply.refresh()

          await setTimeout(1000)
          reply.delete()
        }

        if (state === "cleaningUp") {
          return ["cleaning up..."]
        }

        if (state === "done") {
          return ["done"]
        }

        return [
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
        ]
      })
    },
  })
}
