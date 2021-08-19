import { Client, Intents } from "discord.js"
import "dotenv/config"
import { createConsoleLogger } from "../../gatekeeper/src/internal/logger"
import { createGatekeeper } from "../../gatekeeper/src/main"
import { kitchenSinkCommand } from "./commands/kitchen-sink"

const logger = createConsoleLogger({ name: "bot" })

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

client.on("ready", () => {
  logger.success("Ready")
})

async function main() {
  const gatekeeper = createGatekeeper({ debug: true })

  gatekeeper.addSlashCommand(kitchenSinkCommand)

  gatekeeper.useClient(client, {
    useGlobalCommands: false,
    useGuildCommands: true,
  })

  await client.login(process.env.BOT_TOKEN)
}

// eslint-disable-next-line no-console
main().catch(console.error)
