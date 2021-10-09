import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"
import { createRequire } from "module"
import typescript from "rollup-plugin-ts"

// @ts-expect-error
const require = createRequire(import.meta.url)
const pkg = require("./package.json")

export default {
  input: "./src/main.ts",
  output: [
    {
      file: pkg.main,
      format: "cjs",
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: "es",
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({ tsconfig: "../../tsconfig.json" }),
    nodeResolve({ extensions: [".js", ".ts"] }),
    commonjs(),
  ],
  external: [
    ...Object.keys(pkg.peerDependencies),
    ...Object.keys(pkg.dependencies),
  ],
}
