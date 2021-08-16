/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
import chalk from "chalk"
import { toError } from "./helpers"

const loggerPrefix = chalk.gray`[gatekeeper]`

export type Logger = {
  info(...args: unknown[]): void
  success(...args: unknown[]): void
  error(...args: unknown[]): void
  warn(...args: unknown[]): void
  task(description: string, block: () => Promise<unknown>): Promise<void>
}

export class DebugLogger implements Logger {
  info(...args: unknown[]) {
    console.info(loggerPrefix, chalk.cyan`[i]`, ...args)
  }

  success(...args: unknown[]) {
    console.info(loggerPrefix, chalk.green`[s]`, ...args)
  }

  error(...args: unknown[]) {
    console.error(loggerPrefix, chalk.red`[e]`, ...args)
  }

  warn(...args: unknown[]) {
    console.warn(loggerPrefix, chalk.yellow`[w]`, ...args)
  }

  async task(description: string, block: () => Promise<void>) {
    try {
      this.info(description, chalk.gray`...`)
      await block()
      this.success(description, chalk.green`done`)
    } catch (error) {
      this.error(description, chalk.red`failed`)
      this.error(toError(error).stack || toError(error).message)
    }
  }
}

export class NoopLogger implements Logger {
  info() {}
  success() {}
  error() {}
  warn() {}
  async task() {}
}
