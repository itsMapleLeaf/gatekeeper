import { Client } from "discord.js"
import { mockConsole } from "../internal/mock-console"
import type { GatekeeperConfig } from "./gatekeeper"
import { Gatekeeper } from "./gatekeeper"

const client = new Client({ intents: [] })

describe("logging", () => {
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
    it(scenario.description, async () => {
      const mock = mockConsole()

      await Gatekeeper.create({
        name: "testclient",
        client,
        ...scenario.config,
      })

      expect(mock.fn).toHaveBeenCalledTimes(scenario.expectedCallCount)

      mock.restore()
    })
  }
})
