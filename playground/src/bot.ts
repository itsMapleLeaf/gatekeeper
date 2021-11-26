import { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config"
import { join } from "node:path"

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

void (async () => {
  await Gatekeeper.create({
    name: "playground",
    client,
    commandFolder: join(__dirname, "commands"),
  })

  await client.login(process.env.BOT_TOKEN)
})()
