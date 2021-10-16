/* eslint-disable no-console */
import { buttonComponent, Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"

void (async () => {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
  })

  const gatekeeper = await Gatekeeper.create({
    client,
  })

  gatekeeper.addSlashCommand({
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

  await client.login(process.env.BOT_TOKEN)
})()
