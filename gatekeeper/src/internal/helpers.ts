import type { Falsy } from "./types"

export function raise(error: string | Error): never {
  throw typeof error === "string" ? new Error(error) : error
}

export function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

export function getErrorInfo(error: unknown): string {
  const { stack, message } = toError(error)
  return stack || message
}

export function includes<Value>(
  array: readonly Value[],
  value: unknown,
): value is Value {
  return array.includes(value as Value)
}

export function hasKey<Subject>(
  object: Subject,
  key: PropertyKey,
): key is keyof Subject {
  return key in object
}

export function isTruthy<T>(value: T | Falsy): value is T {
  return !!value
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isObject<T extends object>(
  value: T | string | number | boolean | undefined | null,
): value is T {
  return typeof value === "object" && value !== null
}

export function isString(value: unknown): value is string {
  return typeof value === "string"
}
