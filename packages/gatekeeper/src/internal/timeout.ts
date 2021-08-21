export function createTimeout(ms: number, callback: () => void) {
  let timeoutId = setTimeout(callback, ms)
  return {
    reset() {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(callback, ms)
    },
    cancel() {
      clearTimeout(timeoutId)
    },
    trigger() {
      clearTimeout(timeoutId)
      callback()
    },
  }
}
