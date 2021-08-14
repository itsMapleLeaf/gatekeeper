// @ts-check
import {
  actionRowComponent,
  applyCommands,
  buttonComponent,
} from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config.js"

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
    name: "counter",
    description: "make a counter",
    run: async (context) => {
      const reply = await context.defer()

      let times = 0

      while (true) {
        const counterId = `counter-${Math.random()}`
        const doneId = `done-${Math.random()}`

        await reply.edit(
          `button pressed ${times} times`,
          actionRowComponent(
            buttonComponent({
              style: "PRIMARY",
              label: "press it",
              customId: counterId,
            }),
            buttonComponent({
              style: "PRIMARY",
              label: "i'm bored",
              customId: doneId,
            })
          )
        )

        const interaction = await context.waitForInteraction()

        if (interaction.customId === counterId) {
          times += 1
        }
        if (interaction.customId === doneId) {
          break
        }
      }

      await reply.edit("well fine then")
    },
  },
]

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

applyCommands(client, commands)

client.on("ready", () => {
  console.info("bot running ayy lmao")
})

await client.login(process.env.BOT_TOKEN).catch(console.error)
