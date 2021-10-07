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
  let flushing = false

  function queueFlush() {
    if (flushing) {
      return
    }
    flushing = true

    if (immediateId) {
      clearImmediate(immediateId)
    }

    immediateId = setImmediate(async () => {
      logger.info(
        `Running ${actions.length} actions:`,
        actions.map((a) => a.name).join(", "),
      )

      let action: ActionQueueItem | undefined
      while ((action = actions.shift())) {
        try {
          await logger.promise(
            `Running ${action.name}`,
            Promise.resolve(action.run()),
          )
        } catch {
          // do nothing; the logger will log the error
        }
      }

      flushing = false
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
