// for comparison, this is an example of the code required
// to write a counter command with vanilla DJS
import type { InteractionReplyOptions, Message } from "discord.js"
import { Client, Intents } from "discord.js"
import "dotenv/config"
import { randomUUID } from "node:crypto"

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

client.on("ready", async () => {
  for (const guild of client.guilds.cache.values()) {
    await guild.commands.create({
      name: "counter",
      description: "make a counter",
    })
  }
  // eslint-disable-next-line no-console
  console.info("ready")
})

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName !== "counter") return

  let count = 0

  const countButtonId = randomUUID()
  const doneButtonId = randomUUID()

  const message = (): InteractionReplyOptions => ({
    content: `button pressed ${count} times`,
    components: [
      {
        type: "ACTION_ROW",
        components: [
          {
            type: "BUTTON",
            style: "PRIMARY",
            label: "press it",
            customId: countButtonId,
          },
          {
            type: "BUTTON",
            style: "SECONDARY",
            label: "done",
            customId: doneButtonId,
          },
        ],
      },
    ],
  })

  const reply = (await interaction.reply({
    ...message(),
    fetchReply: true,
  })) as Message

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const componentInteraction = await reply.awaitMessageComponent()

    if (
      componentInteraction.isButton() &&
      componentInteraction.customId === countButtonId
    ) {
      count += 1
      await componentInteraction.update(message())
    }

    if (
      componentInteraction.isButton() &&
      componentInteraction.customId === doneButtonId &&
      componentInteraction.user.id === interaction.user.id
    ) {
      await Promise.all([
        componentInteraction.deferUpdate(),
        interaction.deleteReply(),
      ])
      break
    }
  }
})

// eslint-disable-next-line no-console
client.login(process.env.BOT_TOKEN).catch(console.error)
