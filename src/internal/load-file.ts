import { createRequire } from "node:module"

let require: NodeRequire | undefined

export async function loadFile(path: string) {
  // when in commonjs and running via a `*-register` package,
  // .ts files can't be `import()`ed, and this will throw
  // if it does throw, we'll try `require()` instead
  try {
    return await import(path)
  } catch {
    require ??= createRequire(import.meta.url)
    return require(path)
  }
}
