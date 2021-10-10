#!/usr/bin/env node

const execa = require("execa")
const { join } = require("path")

const jscodeshiftExecutable = require.resolve(".bin/jscodeshift")

execa.sync(
  jscodeshiftExecutable,
  [
    "--transform",
    join(__dirname, "../codemods/migrate.js"),
    "--parser=ts",
    "--extensions=tsx,ts,jsx,js",
    "--verbose=2",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
  },
)
