import replace from "@rollup/plugin-replace"
import typescript from "rollup-plugin-ts"
import pkg from "./package.json"

export default {
  input: "./src/main.ts",
  output: [
    {
      file: pkg.exports.require,
      format: "cjs",
      sourcemap: true,
    },
    {
      file: pkg.exports.import,
      format: "esm",
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({
      tsconfig: "./tsconfig.build.json",
      transpileOnly: true,
    }),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      "preventAssignment": true,
    }),
  ],
  external: [
    ...Object.keys(pkg.peerDependencies),
    ...Object.keys(pkg.dependencies),
    "node:path",
    "node:crypto",
  ],
}
