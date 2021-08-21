import type { Logger } from "./logger"

export type ActionQueueItem = {
  name: string
  priority?: number
  run: () => void | Promise<unknown>
}

export type ActionQueue = ReturnType<typeof createActionQueue>

export function createActionQueue(logger: Logger) {
  const actions: ActionQueueItem[] = []
  let immediateId: NodeJS.Immediate | undefined

  function queueFlush() {
    if (immediateId) {
      clearImmediate(immediateId)
    }

    immediateId = setImmediate(async () => {
      logger.info(
        `Running ${actions.length} actions:`,
        actions.map((a) => a.name).join(", "),
      )

      const queuedActions = [...actions]
      actions.splice(0)

      for (const action of queuedActions) {
        await logger
          .promise(`Running ${action.name}`, Promise.resolve(action.run()))
          .catch() // do nothing; the logger will log the error
      }
    })
  }

  return {
    push: (action: ActionQueueItem) => {
      actions.push(action)
      actions.sort(
        (a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity),
      )
      queueFlush()
    },
  }
}
