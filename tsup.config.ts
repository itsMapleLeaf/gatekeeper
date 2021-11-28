import { defineConfig } from "tsup"

export default defineConfig({
  entryPoints: ["src/main.ts"],
  target: "node16",
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
})
