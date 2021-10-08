import type {
  CommandInteraction,
  InteractionReplyOptions,
  Message,
  MessageComponentInteraction,
} from "discord.js"
import type { Command } from "./command"
import type { InteractionContext } from "./interaction-context"

/**
 * Options for creating a user command.
 * @see defineUserCommand
 */
export type UserCommandConfig = {
  /**
   * The name of the command. This shows up in the context menu for users.
   */
  name: string
  /**
   * The function to call when the command is ran.
   */
  run: (context: InteractionContext) => void | Promise<unknown>
}

export function defineUserCommand(config: UserCommandConfig): Command {
  return {
    name: config.name,

    matchesExisting: (appCommand) => {
      return appCommand.name === config.name && appCommand.type === "USER"
    },

    register: async (commandManager) => {
      await commandManager.create({
        name: config.name,
        type: "USER",
      })
    },

    matchesInteraction: (interaction) =>
      interaction.isContextMenu() &&
      interaction.targetType === "USER" &&
      interaction.commandName === config.name,

    run: async (context) => {
      await config.run(context)
    },
  }
}

async function addReply(
  interaction: CommandInteraction | MessageComponentInteraction,
  options: InteractionReplyOptions,
) {
  if (interaction.deferred && interaction.ephemeral) {
    // edge case: if the reply is deferred and ephemeral,
    // calling followUp will edit the ephemeral loading message
    // instead of creating a new public message,
    // so we have to create this public message manually for now
    // instead of using reply functions
    return interaction.channel?.send(options) as Promise<Message>
  }

  if (interaction.deferred) {
    return interaction.editReply(options) as Promise<Message>
  }

  if (interaction.replied) {
    return interaction.followUp(options) as Promise<Message>
  }

  return interaction.reply({
    ...options,
    fetchReply: true,
  }) as Promise<Message>
}
