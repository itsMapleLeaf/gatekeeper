/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
import chalk from "chalk"
import { toError } from "./helpers"

export type Logger = {
  info(...args: unknown[]): void
  success(...args: unknown[]): void
  error(...args: unknown[]): void
  warn(...args: unknown[]): void
  promise<T>(description: string, promise: Promise<T>): Promise<T>
}

export function createConsoleLogger({ name = "" } = {}): Logger {
  const prefix = name && chalk.gray`[${name}]`

  const logger: Logger = {
    info(...args) {
      console.info(prefix, chalk.cyan`[i]`, ...args)
    },
    success(...args) {
      console.info(prefix, chalk.green`[s]`, ...args)
    },
    error(...args) {
      console.error(prefix, chalk.red`[e]`, ...args)
    },
    warn(...args) {
      console.warn(prefix, chalk.yellow`[w]`, ...args)
    },
    async promise(description, promise) {
      const startTime = Date.now()

      try {
        logger.info(description, chalk.gray`...`)
        const result = await promise
        logger.success(
          description,
          chalk.green`done`,
          chalk.gray`(${Date.now() - startTime}ms)`,
        )
        return result
      } catch (error) {
        logger.error(
          description,
          chalk.red`failed`,
          chalk.gray`(${Date.now() - startTime}ms)`,
        )
        logger.error(toError(error).stack || toError(error).message)
        throw error
      }
    },
  }

  return logger
}

export function createNoopLogger(): Logger {
  return {
    info() {},
    success() {},
    error() {},
    warn() {},
    promise(_description, promise) {
      return promise
    },
  }
}
