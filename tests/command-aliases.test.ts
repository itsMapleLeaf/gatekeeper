import test from "ava"
import type { Client, ContextMenuInteraction } from "discord.js"
import { Gatekeeper } from "../src/core/gatekeeper"
import { deferred } from "./helpers/deferred"
import { createMockClient } from "./helpers/discord"

test("message command aliases", async (t) => {
  const client = createMockClient()
  const instance = await Gatekeeper.create({ client })
  const promise = deferred()

  let calls = 0
  instance.addMessageCommand({
    name: "message",
    aliases: ["message-alias-1", "message-alias-2"],
    run: () => {
      calls += 1
      if (calls === 3) {
        t.pass()
        promise.resolve()
      }
    },
  })

  client.emit(
    "interactionCreate",
    createMockContextMenuInteraction(client, "message", "MESSAGE"),
  )
  client.emit(
    "interactionCreate",
    createMockContextMenuInteraction(client, "message-alias-1", "MESSAGE"),
  )
  client.emit(
    "interactionCreate",
    createMockContextMenuInteraction(client, "message-alias-2", "MESSAGE"),
  )
})

test("user command aliases", async (t) => {
  const client = createMockClient()
  const instance = await Gatekeeper.create({ client })
  const promise = deferred()

  let calls = 0
  instance.addUserCommand({
    name: "user",
    aliases: ["user-alias-1", "user-alias-2"],
    run: () => {
      calls += 1
      if (calls === 3) {
        t.pass()
        promise.resolve()
      }
    },
  })

  client.emit(
    "interactionCreate",
    createMockContextMenuInteraction(client, "user", "USER"),
  )
  client.emit(
    "interactionCreate",
    createMockContextMenuInteraction(client, "user-alias-1", "USER"),
  )
  client.emit(
    "interactionCreate",
    createMockContextMenuInteraction(client, "user-alias-2", "USER"),
  )
})

test("slash command aliases", async (t) => {
  const client = createMockClient()
  const instance = await Gatekeeper.create({ client })
  const promise = deferred()

  let calls = 0
  instance.addSlashCommand({
    name: "slash",
    description: "slash command",
    aliases: ["slash-alias-1", "slash-alias-2"],
    run: () => {
      calls += 1
      if (calls === 3) {
        t.pass()
        promise.resolve()
      }
    },
  })

  client.emit(
    "interactionCreate",
    createMockSlashCommandInteraction(client, "slash"),
  )
  client.emit(
    "interactionCreate",
    createMockSlashCommandInteraction(client, "slash-alias-1"),
  )
  client.emit(
    "interactionCreate",
    createMockSlashCommandInteraction(client, "slash-alias-2"),
  )
})

function createMockSlashCommandInteraction(
  client: Client,
  commandName: string,
) {
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
        fetch: () =>
          Promise.resolve({
            id: "123",
            content: "test",
          }),
      },
    },
  } as unknown as ContextMenuInteraction
}

function createMockContextMenuInteraction(
  client: Client,
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
        fetch: () =>
          Promise.resolve({
            id: "123",
            content: "test",
          }),
      },
    },
  } as unknown as ContextMenuInteraction
}
