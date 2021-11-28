import test from "ava"
import type { ContextMenuInteraction } from "discord.js"
import { Gatekeeper } from "../src/core/gatekeeper"
import { deferred } from "./helpers/deferred"
import { createMockClient } from "./helpers/discord"

test("command errors", async (t) => {
  const promise = deferred()

  const error = new Error("💣 oops 💣")

  const client = createMockClient()

  const instance = await Gatekeeper.create({
    name: "testclient",
    client,
    logging: false,
    onError: (caughtError) => {
      t.is(caughtError, error)
      promise.resolve()
    },
  })

  instance.addMessageCommand({
    name: "test",
    run: () => Promise.reject(error),
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
        fetch: () =>
          Promise.resolve({
            id: "123",
            content: "test",
          }),
      },
    },
  } as unknown as ContextMenuInteraction

  client.emit("interactionCreate", mockInteraction)

  await promise
})

test("gatekeeper error", async (t) => {
  const promise = deferred()

  const client = createMockClient()

  const error = new Error("message not found")

  const instance = await Gatekeeper.create({
    name: "testclient",
    client,
    logging: false,
    onError: (caught) => {
      t.is(caught, error)
      promise.resolve()
    },
  })

  instance.addMessageCommand({
    name: "test",
    run: () => {},
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
        fetch: () => Promise.reject(error),
      },
    },
  } as unknown as ContextMenuInteraction

  client.emit("interactionCreate", mockInteraction)

  await promise
})
