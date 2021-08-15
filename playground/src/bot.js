// @ts-check
import { CommandManager } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config.js"
import { buttonCommand } from "./commands/button.js"
import { counterCommand } from "./commands/counter.js"
import { doubleCommand } from "./commands/double.js"
import { ephemeralCounterCommand } from "./commands/ephemeral-counter.js"
import { multiCounterCommand } from "./commands/multi-counter.js"
import { multiSelectCommand } from "./commands/multi-select.js"
import { selectCommand } from "./commands/select.js"

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

const manager = CommandManager.create()

const isDev = process.env.NODE_ENV !== "production"

if (isDev) {
  manager.enableLogging()
}

manager
  .addSlashCommand({
    name: "ping",
    description: "pong",
    async run(context) {
      await context.createReply(() => ["pong!"])
    },
  })
  .addSlashCommand(buttonCommand)
  .addSlashCommand(selectCommand)
  .addSlashCommand(multiSelectCommand)
  .addSlashCommand(counterCommand)
  .addSlashCommand(multiCounterCommand)
  .addSlashCommand(ephemeralCounterCommand)
  .addSlashCommand(doubleCommand)
  .useClient(client, {
    useGlobalCommands: false,
    useGuildCommands: true,
  })

await client.login(process.env.BOT_TOKEN).catch(console.error)
