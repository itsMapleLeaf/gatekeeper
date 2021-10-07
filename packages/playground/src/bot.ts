import { createGatekeeper } from "@itsmapleleaf/gatekeeper/src/core.new/gatekeeper"
import { defineUserCommand } from "@itsmapleleaf/gatekeeper/src/core.new/user-command"
import { Client, Intents } from "discord.js"
import "dotenv/config"

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

createGatekeeper({
  client,
  commands: [
    defineUserCommand({
      name: "hug",
      run(context) {},
    }),
  ],
})

// eslint-disable-next-line no-console
client.login(process.env.BOT_TOKEN).catch(console.error)
