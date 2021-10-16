/* eslint-disable no-console */
export function mockConsole() {
  const consoleCalls: unknown[][] = []
  const fn = jest.fn((...message: unknown[]) => consoleCalls.push(message))

  const originalMethods = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  }

  console.log = console.error = console.info = console.warn = fn

  return {
    fn,
    restore: () => {
      console.log = originalMethods.log
      console.warn = originalMethods.warn
      console.error = originalMethods.error
      console.info = originalMethods.info
    },
  }
}
