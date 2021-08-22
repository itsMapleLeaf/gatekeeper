import type { Falsy, Primitive, UnknownRecord } from "./types"

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

/**
 * Checks at runtime if a value is a non-primitive,
 * while narrowing primitives out of the type
 */
export function isObject<T>(value: T | Primitive): value is T {
  return typeof value === "object" && value !== null
}

/**
 * Like {@link isObject}, but accepts unknown,
 * and narrows it to a more usable UnknownRecord
 */
export function isAnyObject(value: unknown): value is UnknownRecord {
  return isObject(value)
}

export function isString(value: unknown): value is string {
  return typeof value === "string"
}

export function isNonNil<T>(value: T | undefined | null): value is T {
  return value != null
}
