import type { Format } from "tsup"

export function loadFile(path: string) {
  if (__BUILD_FORMAT__ === "esm") return import(path)
  if (__BUILD_FORMAT__ === "cjs") return require(path)
  throw new Error(`Unsupported build format: ${__BUILD_FORMAT__}`)
}

declare global {
  const __BUILD_FORMAT__: Format
}
