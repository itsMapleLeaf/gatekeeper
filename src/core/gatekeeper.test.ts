import type { ContextMenuInteraction } from "discord.js"
import { Client } from "discord.js"
import { mockConsole } from "../internal/mock-console"
import { waitFor } from "../internal/wait-for"
import type { GatekeeperConfig } from "./gatekeeper"
import { createGatekeeperLogger, Gatekeeper } from "./gatekeeper"

const client = new Client({ intents: [] })

client.users.cache.set("123", {
  id: "123",
  username: "test",
  discriminator: "1234",
  bot: false,
  createdAt: new Date(),
} as any)

describe("logging option", () => {
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

      const logger = createGatekeeperLogger(scenario.config as GatekeeperConfig)
      logger.info("test logging info")
      logger.warn("test logging warn")
      logger.error("test logging error")
      logger.success("test logging success")

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

describe("aliases", () => {
  test("message command aliases", async () => {
    const instance = await Gatekeeper.create({ client })

    const run = jest.fn()
    instance.addMessageCommand({
      name: "message",
      aliases: ["message-alias-1", "message-alias-2"],
      run,
    })

    client.emit(
      "interactionCreate",
      createMockContextMenuInteraction("message", "MESSAGE"),
    )
    client.emit(
      "interactionCreate",
      createMockContextMenuInteraction("message-alias-1", "MESSAGE"),
    )

    await waitFor(() => expect(run).toHaveBeenCalledTimes(2))

    client.emit(
      "interactionCreate",
      createMockContextMenuInteraction("message-alias-2", "MESSAGE"),
    )

    await waitFor(() => expect(run).toHaveBeenCalledTimes(3))
  })

  test("user command aliases", async () => {
    const instance = await Gatekeeper.create({ client })

    const run = jest.fn()
    instance.addUserCommand({
      name: "user",
      aliases: ["user-alias-1", "user-alias-2"],
      run,
    })

    client.emit(
      "interactionCreate",
      createMockContextMenuInteraction("user", "USER"),
    )
    client.emit(
      "interactionCreate",
      createMockContextMenuInteraction("user-alias-1", "USER"),
    )

    await waitFor(() => expect(run).toHaveBeenCalledTimes(2))

    client.emit(
      "interactionCreate",
      createMockContextMenuInteraction("user-alias-2", "USER"),
    )

    await waitFor(() => expect(run).toHaveBeenCalledTimes(3))
  })

  test("slash command aliases", async () => {
    const instance = await Gatekeeper.create({ client })

    const run = jest.fn()
    instance.addSlashCommand({
      name: "slash",
      description: "slash command",
      aliases: ["slash-alias-1", "slash-alias-2"],
      run,
    })

    client.emit("interactionCreate", createMockSlashCommandInteraction("slash"))
    client.emit(
      "interactionCreate",
      createMockSlashCommandInteraction("slash-alias-1"),
    )

    await waitFor(() => expect(run).toHaveBeenCalledTimes(2))

    client.emit(
      "interactionCreate",
      createMockSlashCommandInteraction("slash-alias-2"),
    )

    await waitFor(() => expect(run).toHaveBeenCalledTimes(3))
  })
})

function createMockSlashCommandInteraction(commandName: string) {
  return {
    type: "APPLICATION_COMMAND",
    isCommand: () => true,
    isContextMenu: () => false,
    isMessageComponent: () => false,
    commandName,
    targetType: "MESSAGE",
    targetId: "123",
    client,
    channel: {
      messages: {
        fetch: jest.fn().mockResolvedValue({
          id: "123",
          content: "test",
        }),
      },
    },
  } as unknown as ContextMenuInteraction
}

function createMockContextMenuInteraction(
  commandName: string,
  targetType: "USER" | "MESSAGE",
) {
  return {
    type: "CONTEXT_MENU",
    isCommand: () => true,
    isContextMenu: () => true,
    isMessageComponent: () => false,
    commandName,
    targetType,
    targetId: "123",
    client,
    channel: {
      messages: {
        fetch: jest.fn().mockResolvedValue({
          id: "123",
          content: "test",
        }),
      },
    },
  } as unknown as ContextMenuInteraction
}
