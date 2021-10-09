import { createRequire } from "module"
import typescript from "rollup-plugin-ts"

// @ts-expect-error
const require = createRequire(import.meta.url)
const pkg = require("./package.json")

export default {
  input: "./src/main.ts",
  output: {
    file: pkg.main,
    format: "cjs",
    sourcemap: true,
  },
  plugins: [
    typescript({
      tsconfig: "../../tsconfig.json",
      transpileOnly: true,
    }),
  ],
  external: [
    ...Object.keys(pkg.peerDependencies),
    ...Object.keys(pkg.dependencies),
    "node:path",
    "node:crypto",
  ],
}
