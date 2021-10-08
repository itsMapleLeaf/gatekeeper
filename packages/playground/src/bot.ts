import { createGatekeeper } from "@itsmapleleaf/gatekeeper/src/core.new/gatekeeper"
import { defineUserCommand } from "@itsmapleleaf/gatekeeper/src/core.new/user-command"
import { Client, Intents } from "discord.js"
import "dotenv/config"
import { setTimeout } from "node:timers/promises"

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

createGatekeeper({
  client,
  commands: [
    defineUserCommand({
      name: "hug",
      async run(context) {
        const reply = context.reply(() => "the")
        await setTimeout(1000)
        reply.delete()
      },
    }),
    defineUserCommand({
      name: "countdown",
      async run(context) {
        let count = 5
        const reply = context.reply(() => count)

        do {
          await setTimeout(1000)
          count -= 1
          reply.refresh()
        } while (count > 0)

        await setTimeout(1000)
        reply.delete()
      },
    }),
  ],
})

// eslint-disable-next-line no-console
client.login(process.env.BOT_TOKEN).catch(console.error)
