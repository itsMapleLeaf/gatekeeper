// @ts-check
import {
  actionRowComponent,
  applyCommands,
  buttonComponent,
} from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config.js"
import { counterCommand } from "./counter.js"
import { ephemeralCounterCommand } from "./ephemeral-counter.js"
import { multiCounterCommand } from "./multi-counter.js"
import { multiSelectCommand } from "./multi-select.js"
import { selectCommand } from "./select.js"

/** @type {import("@itsmapleleaf/gatekeeper").CommandHandler[]} */
const commands = [
  {
    name: "ping",
    description: "pong",
    async run(context) {
      await context.createReply(() => ["pong!"])
    },
  },

  {
    name: "button",
    description: "testing a button",
    async run(context) {
      let result = ""

      await context.createReply(() => {
        if (result) {
          return [result]
        }

        return [
          "button",
          actionRowComponent(
            buttonComponent({
              style: "PRIMARY",
              label: "first",
              onClick: () => {
                result = "you clicked the first"
              },
            }),
            buttonComponent({
              style: "SECONDARY",
              label: "second",
              onClick: () => {
                result = "you clicked the second"
              },
            }),
          ),
        ]
      })
    },
  },

  selectCommand,
  multiSelectCommand,
  counterCommand,
  multiCounterCommand,
  ephemeralCounterCommand,
]

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

applyCommands(client, commands)

await client.login(process.env.BOT_TOKEN).catch(console.error)
