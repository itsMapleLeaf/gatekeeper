type ActionQueueConfig = {
  onError: (actionName: string, error: unknown) => void
}

type ActionQueueAction = {
  name: string
  priority?: number
  run: () => Promise<void>
}

export class ActionQueue {
  private readonly config: ActionQueueConfig
  private readonly actions: ActionQueueAction[] = []
  private running = false

  constructor(config: ActionQueueConfig) {
    this.config = config
  }

  addAction(action: ActionQueueAction) {
    this.actions.push(action)

    this.actions.sort(
      (a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity),
    )

    this.runActions()
  }

  private runActions() {
    if (this.running) return
    this.running = true

    // allow multiple synchronous calls before running actions
    queueMicrotask(async () => {
      let action: ActionQueueAction | undefined
      while ((action = this.actions.shift())) {
        try {
          await action.run()
        } catch (error) {
          this.config.onError(action.name, error)
        }
      }
      this.running = false
    })
  }
}
