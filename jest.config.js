/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  transform: {
    "^.+\\.tsx?$": [
      "esbuild-jest",
      { sourcemap: true, format: "esm", target: "node16" },
    ],
  },
  verbose: true,
  extensionsToTreatAsEsm: [".ts"],
}
export default config
