import { setTimeout } from "node:timers/promises"

export async function waitFor(fn: () => unknown) {
  const startTime = Date.now()

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn()
    } catch (error) {
      if (Date.now() - startTime > 5000) {
        throw error
      }
      await setTimeout(50)
    }
  }
}
