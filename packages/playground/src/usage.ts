/* eslint-disable no-console */
import {
  buttonComponent,
  createGatekeeper,
  defineSlashCommand,
} from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"

const counterCommand = defineSlashCommand({
  name: "counter",
  description: "make a counter",
  run(context) {
    let count = 0

    context.reply(() => [
      `button pressed ${count} times`,
      buttonComponent({
        style: "PRIMARY",
        label: "press it",
        onClick: () => {
          count += 1
        },
      }),
    ])
  },
})

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

createGatekeeper({
  client,
  commands: [counterCommand],
})

client.login(process.env.BOT_TOKEN).catch(console.error)
