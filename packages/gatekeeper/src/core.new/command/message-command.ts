import type { Message } from "discord.js"
import { raise } from "../../internal/helpers"
import type { InteractionContext } from "../interaction-context"
import { createInteractionContext } from "../interaction-context"
import type { Command } from "./command"

/**
 * Options for creating a message command.
 * @see defineMessageCommand
 */
export type MessageCommandConfig = {
  /**
   * The name of the command. This shows up in the context menu for messages.
   */
  name: string
  /**
   * The function to call when the command is ran.
   */
  run: (context: MessageCommandInteractionContext) => void | Promise<unknown>
}

export type MessageCommandInteractionContext = InteractionContext & {
  targetMessage: Message
}

export function defineMessageCommand(config: MessageCommandConfig): Command {
  return {
    name: config.name,

    matchesExisting: (appCommand) => {
      return appCommand.name === config.name && appCommand.type === "MESSAGE"
    },

    register: async (commandManager) => {
      await commandManager.create({
        name: config.name,
        type: "MESSAGE",
      })
    },

    matchesInteraction: (interaction) =>
      interaction.isContextMenu() &&
      interaction.targetType === "MESSAGE" &&
      interaction.commandName === config.name,

    run: async (interaction, command) => {
      const isMessageInteraction =
        interaction.isContextMenu() &&
        interaction.channel &&
        interaction.targetType === "MESSAGE"

      if (!isMessageInteraction)
        raise("Expected a context menu message interaction")

      const targetMessage = await interaction.channel.messages.fetch(
        interaction.targetId,
      )

      await config.run({
        ...createInteractionContext({ interaction, command }),
        targetMessage,
      })
    },
  }
}
