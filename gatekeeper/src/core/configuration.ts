import type { Client, Guild, GuildMember } from "discord.js"
import { bindClientEvents } from "../internal/client-events.js"
import {
  CommandHandler,
  CommandHandlerContext,
  CommandReplyInstance,
  createCommandHandlerContext,
} from "./command-handler.js"

async function syncCommands(commands: CommandHandler[], guild: Guild) {
  for (const command of commands) {
    console.info(`Adding command: ${command.name}`)
    await guild.commands.create(command)
  }

  const commandNames = new Set(commands.map((c) => c.name))
  for (const appCommand of guild.commands.cache.values() ?? []) {
    if (!commandNames.has(appCommand.name)) {
      console.info(`Removing command: ${appCommand.name}`)
      await guild.commands.delete(appCommand.id)
    }
  }
}

export function applyCommands(client: Client, commands: CommandHandler[]) {
  const messageInstances = new Set<CommandReplyInstance>()

  bindClientEvents(client, {
    async ready() {
      console.info("Ready")

      for (const [, guild] of client.guilds.cache) {
        await syncCommands(commands, guild)
      }
    },

    async guildCreate(guild) {
      await syncCommands(commands, guild)
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
          messageInstances,
        )

        await handler.run(context)
      }

      if (interaction.isMessageComponent()) {
        // give a bit of time for the instance to handle the interaction
        // before deferring it
        let deferred = false
        const timeout = setTimeout(() => {
          interaction.deferUpdate()
          deferred = true
        }, 3000)

        await Promise.all(
          [...messageInstances].map((instance) =>
            instance.handleMessageComponentInteraction(interaction),
          ),
        )

        if (!deferred) {
          clearTimeout(timeout)
          interaction.deferUpdate()
        }
      }
    },
  })
}
