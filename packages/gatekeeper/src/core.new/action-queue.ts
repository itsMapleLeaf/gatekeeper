type ActionQueueAction<Result> = {
  name: string
  priority?: number
  run: () => Result | Promise<Result>
}

export class ActionQueue {
  private readonly actions: Array<ActionQueueAction<unknown>> = []
  private running = false

  addAction<Result>(action: ActionQueueAction<Result>): Promise<Result> {
    const promise = new Promise<Result>((resolve, reject) => {
      this.actions.push({
        ...action,
        run: async () => {
          try {
            resolve(await action.run())
          } catch (error) {
            reject(error)
            throw error
          }
        },
      })
    })

    this.actions.sort((a, b) => {
      if (a.priority == null) return 1
      if (b.priority == null) return -1
      return a.priority - b.priority
    })

    void this.runActions()

    return promise
  }

  private async runActions() {
    if (this.running) return
    this.running = true

    let action: ActionQueueAction<unknown> | undefined
    while ((action = this.actions.shift())) {
      try {
        await action.run()
      } catch (error) {
        console.error("error running action", action.name, error)
      }
    }

    this.running = false
  }
}
