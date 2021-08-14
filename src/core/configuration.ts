import type {
  Client,
  CommandInteraction,
  GuildMember,
  Message,
  MessageComponentInteraction,
  Snowflake,
} from "discord.js"
import { AsyncQueue } from "../internal/async-queue.js"
import { bindClientEvents } from "../internal/client-events.js"
import {
  addOrCreateReply,
  getComponentInteractionInfo,
} from "../internal/interaction-helpers"
import type { CommandHandler, CommandHandlerContext } from "./command-handler"
import { createReplyOptions } from "./reply-component"

const interactionQueue = new AsyncQueue<MessageComponentInteraction>()

function createCommandHandlerContext(
  interaction: CommandInteraction,
  member: GuildMember
): CommandHandlerContext {
  return {
    member,

    async addReply(...components) {
      const message = await addOrCreateReply(
        interaction,
        createReplyOptions(components)
      )

      return {
        async edit(...components) {
          await message.edit(createReplyOptions(components))
        },
        async delete() {
          await message.delete()
        },
      }
    },

    async addEphemeralReply(...components) {
      const message = await addOrCreateReply(interaction, {
        ...createReplyOptions(components),
        ephemeral: true,
      })

      return {
        async edit(...components) {
          await message.edit(createReplyOptions(components))
        },
      }
    },

    async defer() {
      const message = (await interaction.deferReply({
        fetchReply: true,
      })) as Message

      return {
        async edit(...components) {
          await message.edit(createReplyOptions(components))
        },
        async delete() {
          await message.delete()
        },
      }
    },

    async waitForInteraction() {
      const interaction = await interactionQueue.pop()
      return getComponentInteractionInfo(interaction)
    },
  }
}

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
          interaction.member as GuildMember
        )

        await handler.run(context)
      }

      if (interaction.isMessageComponent()) {
        await interaction.deferUpdate()
        interactionQueue.add(interaction)
      }
    },
  })
}
