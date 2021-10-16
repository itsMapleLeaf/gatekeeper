import type { ContextMenuInteraction } from "discord.js"
import { Client } from "discord.js"
import { mockConsole } from "../internal/mock-console"
import { waitFor } from "../internal/wait-for"
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

describe("onError", () => {
  it("should be called when an error happens in commands", async () => {
    const onError = jest.fn()

    const instance = await Gatekeeper.create({
      name: "testclient",
      client,
      logging: false,
      onError,
    })

    const error = new Error("💣 oops 💣")

    instance.addMessageCommand({
      name: "test",
      run: () => {
        throw error
      },
    })

    const mockInteraction = {
      type: "APPLICATION_COMMAND",
      isCommand: () => true,
      isContextMenu: () => true,
      isMessageComponent: () => false,
      commandName: "test",
      targetType: "MESSAGE",
      targetId: "123",
      channel: {
        messages: {
          fetch: jest.fn().mockResolvedValue({
            id: "123",
            content: "test",
          }),
        },
      },
    } as unknown as ContextMenuInteraction

    client.emit("interactionCreate", mockInteraction)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(error)
    })
  })

  it("should be called when something goes wrong in gatekeeper", async () => {
    const onError = jest.fn()

    const instance = await Gatekeeper.create({
      name: "testclient",
      client,
      logging: false,
      onError,
    })

    instance.addMessageCommand({
      name: "test",
      run: () => {},
    })

    const error = new Error("message not found")

    const mockInteraction = {
      type: "APPLICATION_COMMAND",
      isCommand: () => true,
      isContextMenu: () => true,
      isMessageComponent: () => false,
      commandName: "test",
      targetType: "MESSAGE",
      targetId: "123",
      channel: {
        messages: {
          fetch: jest.fn().mockRejectedValue(error),
        },
      },
    } as unknown as ContextMenuInteraction

    client.emit("interactionCreate", mockInteraction)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(error)
    })
  })
})
