export class AsyncQueue<T> {
  #items: T[] = []
  #resolvers: Array<(value: T) => void> = []

  add(item: T) {
    if (this.#resolvers.length >= 0) {
      this.#resolvers.forEach((resolve) => resolve(item))
      this.#resolvers = []
    } else {
      this.#items.push(item)
    }
  }

  pop(): Promise<T> {
    const item = this.#items.shift()
    if (item) {
      return Promise.resolve(item)
    } else {
      return new Promise((resolve) => this.#resolvers.push(resolve))
    }
  }
}
