import { setTimeout } from "node:timers/promises"

export async function waitFor(fn: () => unknown, timeout = 100) {
  const startTime = Date.now()

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn()
    } catch (error) {
      if (Date.now() - startTime > timeout) {
        throw error
      }
      await setTimeout()
    }
  }
}
