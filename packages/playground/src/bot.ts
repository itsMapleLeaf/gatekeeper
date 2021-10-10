import { Gatekeeper } from "@itsmapleleaf/gatekeeper/src/main"
import { Client, Intents } from "discord.js"
import "dotenv/config"
import { join } from "path/posix"

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

void (async () => {
  await Gatekeeper.create({
    name: "playground",
    client,
    commandFolder: join(__dirname, "commands"),
  })

  // eslint-disable-next-line no-console
  await client.login(process.env.BOT_TOKEN)
})()
