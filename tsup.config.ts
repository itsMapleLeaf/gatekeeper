import { defineConfig } from "tsup"

export default defineConfig({
  entryPoints: ["src/main.ts"],
  target: "node16",
  format: ["cjs", "esm"],
  dts: true,
  esbuildOptions(options, context) {
    options.define ??= {}
    options.define.__BUILD_FORMAT__ = JSON.stringify(context.format)
  },
})
