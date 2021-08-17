/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
import chalk from "chalk"
import { toError } from "./helpers"

export type Logger = {
  info(...args: unknown[]): void
  success(...args: unknown[]): void
  error(...args: unknown[]): void
  warn(...args: unknown[]): void
  // TODO: accept a promise instead of a callback, rename to promise
  task<T>(description: string, block: () => Promise<T>): Promise<T>
}

type ConsoleLoggerOptions = {
  name?: string
}

export class ConsoleLogger implements Logger {
  readonly #options: ConsoleLoggerOptions

  private constructor(options: ConsoleLoggerOptions) {
    this.#options = options
  }

  static withName(name: string) {
    return new ConsoleLogger({ name })
  }

  get name() {
    return this.#options.name && chalk.gray`[${this.#options.name}]`
  }

  info(...args: unknown[]) {
    console.info(this.name, chalk.cyan`[i]`, ...args)
  }

  success(...args: unknown[]) {
    console.info(this.name, chalk.green`[s]`, ...args)
  }

  error(...args: unknown[]) {
    console.error(this.name, chalk.red`[e]`, ...args)
  }

  warn(...args: unknown[]) {
    console.warn(this.name, chalk.yellow`[w]`, ...args)
  }

  async task<T>(description: string, block: () => Promise<T>) {
    try {
      this.info(description, chalk.gray`...`)
      const result = await block()
      this.success(description, chalk.green`done`)
      return result
    } catch (error) {
      this.error(description, chalk.red`failed`)
      this.error(toError(error).stack || toError(error).message)
      throw error
    }
  }
}

export class NoopLogger implements Logger {
  info() {}
  success() {}
  error() {}
  warn() {}
  task<T>(_description: string, block: () => Promise<T>) {
    return block()
  }
}
