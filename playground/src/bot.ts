import { Client, Intents } from "discord.js"
import "dotenv/config"
import glob from "fast-glob"
import { ConsoleLogger } from "../../gatekeeper/src/internal/logger"
import { Gatekeeper } from "../../gatekeeper/src/main"

const logger = ConsoleLogger.withName("bot")

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

client.on("ready", () => {
  logger.success("Ready")
})

async function main() {
  const manager = Gatekeeper.create({ debug: false })

  await manager.loadCommands(
    await glob("commands/**/*.ts", { absolute: true, cwd: __dirname }),
  )

  manager.useClient(client, {
    useGlobalCommands: false,
    useGuildCommands: true,
  })

  await client.login(process.env.BOT_TOKEN)
}

// eslint-disable-next-line no-console
main().catch(console.error)
