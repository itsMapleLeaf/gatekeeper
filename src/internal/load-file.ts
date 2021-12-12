import { createRequire } from "node:module"

let require: NodeRequire | undefined

export async function loadFile(path: string) {
  // when in commonjs and running via a `*-register` package,
  // .ts files can't be `import()`ed, and this will throw
  // if it does throw, we'll try `require()` instead
  try {
    return await import(path)
  } catch (error) {
    try {
      require ??= createRequire(import.meta.url)
      return require(path)
    } catch {
      // at this point, there's an actual problem with the imported file, so report the original error
      throw error
    }
  }
}
