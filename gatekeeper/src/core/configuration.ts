import type {
  Client,
  GuildMember,
  MessageComponentInteraction,
  Snowflake,
} from "discord.js"
import { AsyncQueue } from "../internal/async-queue.js"
import { bindClientEvents } from "../internal/client-events.js"
import {
  CommandHandler,
  CommandHandlerContext,
  createCommandHandlerContext,
} from "./command-handler"

async function syncCommands(
  bot: Client,
  commands: CommandHandler[],
  guildId: Snowflake
) {
  for (const command of commands) {
    console.info(`Adding command: ${command.name}`)
    await bot.application?.commands.create(command, guildId)
  }

  const commandNames = new Set(commands.map((c) => c.name))
  for (const appCommand of bot.application?.commands.cache.values() ?? []) {
    if (!commandNames.has(appCommand.name)) {
      console.info(`Removing command: ${appCommand.name}`)
      await bot.application?.commands.delete(appCommand.id)
    }
  }
}

export function applyCommands(client: Client, commands: CommandHandler[]) {
  const interactionQueue = new AsyncQueue<MessageComponentInteraction>()

  bindClientEvents(client, {
    async ready() {
      console.info("Ready")

      for (const [, guild] of client.guilds.cache) {
        await syncCommands(client, commands, guild.id)
      }
    },

    async guildCreate(guild) {
      await syncCommands(client, commands, guild.id)
    },

    async interactionCreate(interaction) {
      if (!interaction.inGuild()) {
        return
      }

      if (interaction.isCommand()) {
        const handler = commands.find((c) => c.name === interaction.commandName)
        if (!handler) return

        const context: CommandHandlerContext = createCommandHandlerContext(
          interaction,
          interaction.member as GuildMember,
          interactionQueue
        )

        await handler.run(context)
      }

      if (interaction.isMessageComponent()) {
        interactionQueue.add(interaction)
        await interaction.deferUpdate()
      }
    },
  })
}
