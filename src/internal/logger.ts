/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
import chalk from "chalk"
import { toError } from "./helpers"

export type Logger = {
  info(...args: unknown[]): void
  success(...args: unknown[]): void
  error(...args: unknown[]): void
  warn(...args: unknown[]): void
  promise<T>(description: string, promise: Promise<T> | T): Promise<T>
  block<T>(description: string, block: () => Promise<T> | T): Promise<T>
}

export type ConsoleLoggerLevel = "info" | "success" | "error" | "warn"

export type ConsoleLoggerConfig = {
  name?: string
  levels?: ConsoleLoggerLevel[]
}

export function createConsoleLogger(config: ConsoleLoggerConfig = {}): Logger {
  const prefix = config.name ? chalk.gray`[${config.name}]` : ""

  const levels = new Set<ConsoleLoggerLevel>(
    config.levels || ["info", "success", "error", "warn"],
  )

  const logger: Logger = {
    info(...args) {
      if (levels.has("info")) {
        console.info(prefix, chalk.cyan`[i]`, ...args)
      }
    },
    success(...args) {
      if (levels.has("success")) {
        console.info(prefix, chalk.green`[s]`, ...args)
      }
    },
    error(...args) {
      if (levels.has("error")) {
        console.error(prefix, chalk.red`[e]`, ...args)
      }
    },
    warn(...args) {
      if (levels.has("warn")) {
        console.warn(prefix, chalk.yellow`[w]`, ...args)
      }
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
    async block(description, block) {
      return logger.promise(description, block())
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
    async promise(_description, promise) {
      return promise
    },
    async block(_description, block) {
      return block()
    },
  }
}
