import { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config"
import { dirname, join } from "node:path"

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

await Gatekeeper.create({
  name: "playground",
  client,
  commandFolder: join(dirname(import.meta.url), "commands"),
})

await client.login(process.env.BOT_TOKEN)
