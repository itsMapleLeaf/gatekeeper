// @ts-check
import { applyCommands } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config.js"
import { ephemeralCounterCommand } from "./ephemeral-counter.js"
import { multiCounterCommand } from "./multi-counter.js"

/** @type {import("@itsmapleleaf/gatekeeper").CommandHandler[]} */
const commands = [
  // {
  //   name: "ping",
  //   description: "pong",
  //   async run(context) {
  //     await context.addReply("pong!")
  //   },
  // },

  // {
  //   name: "button",
  //   description: "testing a button",
  //   async run(context) {
  //     let secret = "you clicked nothing???"

  //     const reply = await context.addReply(
  //       "button",
  //       actionRowComponent(
  //         buttonComponent({
  //           style: "PRIMARY",
  //           label: "first",
  //           onClick: () => {
  //             secret = "you clicked the first"
  //           },
  //         }),
  //         buttonComponent({
  //           style: "SECONDARY",
  //           label: "second",
  //           onClick: () => {
  //             secret = "you clicked the second"
  //           },
  //         }),
  //       ),
  //     )

  //     await reply.edit(secret)
  //   },
  // },

  // selectCommand,
  // counterCommand,
  multiCounterCommand,
  ephemeralCounterCommand,
]

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

applyCommands(client, commands)

// client.on("ready", () => {
//   console.info("bot running ayy lmao")

//   for (const guild of client.guilds.cache.values()) {
//     guild.commands.create({
//       name: "test",
//       description: "test",
//     })
//   }
// })

// client.on("interactionCreate", async (interaction) => {
//   if (interaction.isCommand() && interaction.commandName === "test") {
//     await interaction.reply({
//       ephemeral: true,
//       content: "test",
//     })

//     await wait(1000)

//     await interaction.editReply({
//       content: "test",
//       components: [
//         new MessageActionRow().addComponents(
//           new MessageButton()
//             .setLabel("clicc")
//             .setStyle("PRIMARY")
//             .setCustomId("test"),
//         ),
//       ],
//     })
//   }

//   if (interaction.isButton() && interaction.customId === "test") {
//     await interaction.update({
//       content: "good job",
//       components: [],
//     })
//   }
// })

await client.login(process.env.BOT_TOKEN).catch(console.error)
