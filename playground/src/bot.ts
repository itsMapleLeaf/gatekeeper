import { CommandManager } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config"
import { buttonCommand } from "./commands/button"
import { callbackInfoCommand } from "./commands/callback-info"
import { counterCommand } from "./commands/counter"
import { doubleCommand } from "./commands/double"
import { ephemeralCounterCommand } from "./commands/ephemeral-counter"
import { multiCounterCommand } from "./commands/multi-counter"
import { multiSelectCommand } from "./commands/multi-select"
import { selectCommand } from "./commands/select"

const isDev = process.env.NODE_ENV !== "production"

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

CommandManager.create({ logging: isDev })
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
  .addSlashCommand(callbackInfoCommand)
  .useClient(client, {
    useGlobalCommands: false,
    useGuildCommands: true,
  })

// eslint-disable-next-line no-console
client.login(process.env.BOT_TOKEN).catch(console.error)
