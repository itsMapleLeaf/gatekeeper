// @ts-check
import {
  actionRowComponent,
  applyCommands,
  buttonComponent,
} from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config.js"
import { counterCommand } from "./counter.js"
import { selectCommand } from "./select.js"

/** @type {import("@itsmapleleaf/gatekeeper").CommandHandler[]} */
const commands = [
  {
    name: "ping",
    description: "pong",
    async run(context) {
      await context.addReply("pong!")
    },
  },

  {
    name: "button",
    description: "testing a button",
    async run(context) {
      let secret = "you clicked nothing???"

      const reply = await context.addReply(
        "button",
        actionRowComponent(
          buttonComponent({
            style: "PRIMARY",
            label: "first",
            onClick: () => {
              secret = "you clicked the first"
            },
          }),
          buttonComponent({
            style: "SECONDARY",
            label: "second",
            onClick: () => {
              secret = "you clicked the second"
            },
          })
        )
      )

      await reply.edit(secret)
    },
  },

  selectCommand,
  counterCommand,
]

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

applyCommands(client, commands)

client.on("ready", () => {
  console.info("bot running ayy lmao")
})

await client.login(process.env.BOT_TOKEN).catch(console.error)
