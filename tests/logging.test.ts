import test from "ava"
import type { GatekeeperConfig } from "../dist/main"
import { createGatekeeperLogger } from "../src/core/gatekeeper"
import { mockConsole } from "../src/internal/mock-console"

type Scenario = {
  description: string
  config: Partial<GatekeeperConfig>
  expectedCallCount: number
}

const scenarios: Scenario[] = [
  {
    description: "should log everything by default",
    config: {},
    expectedCallCount: 4,
  },
  {
    description: "should log everything when passed true",
    config: { logging: true },
    expectedCallCount: 4,
  },
  {
    description: "should log nothing when passed false",
    config: { logging: false },
    expectedCallCount: 0,
  },
  {
    description: "should log nothing with an empty array",
    config: { logging: [] },
    expectedCallCount: 0,
  },
  {
    description: "should accept an array of levels (1)",
    config: { logging: ["info", "success"] },
    expectedCallCount: 2,
  },
  {
    description: "should accept an array of levels (2)",
    config: { logging: ["error", "warn"] },
    expectedCallCount: 2,
  },
  {
    description: "should accept an array of levels (3)",
    config: { logging: ["success", "info"] },
    expectedCallCount: 2,
  },
  {
    description: "should accept an array of levels (4)",
    config: { logging: ["success", "info", "warn", "error"] },
    expectedCallCount: 4,
  },
]

for (const scenario of scenarios) {
  test(scenario.description, async (t) => {
    const mock = mockConsole()

    const logger = createGatekeeperLogger(scenario.config as GatekeeperConfig)
    logger.info("test logging info")
    logger.warn("test logging warn")
    logger.error("test logging error")
    logger.success("test logging success")

    mock.restore()

    t.is(mock.consoleCalls.length, scenario.expectedCallCount)
  })
}
