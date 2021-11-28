import type { Message } from "discord.js"
import { raise } from "../../internal/helpers"
import type { InteractionContext } from "../interaction-context"
import { createInteractionContext } from "../interaction-context"
import type { Command } from "./command"
import { createCommand } from "./command"

/**
 * Options for creating a message command. Shows when right-clicking a message.
 * @see Gatekeeper.addMessageCommand
 */
export type MessageCommandConfig = {
  /**
   * The name of the command. This shows up in the context menu for messages.
   */
  name: string

  /** Aliases: alternate names to call this command with */
  aliases?: string[]

  /**
   * The function to call when the command is ran.
   */
  run: (context: MessageCommandInteractionContext) => void | Promise<unknown>
}

/** The context object received when running a message command */
export type MessageCommandInteractionContext = InteractionContext & {
  /** The message that the command was run on */
  targetMessage: Message
}

export function createMessageCommands(config: MessageCommandConfig): Command[] {
  const names = [config.name, ...(config.aliases || [])]

  return names.map((name) =>
    createCommand({
      name,

      matchesExisting: (appCommand) => {
        return appCommand.name === name && appCommand.type === "MESSAGE"
      },

      register: async (commandManager) => {
        await commandManager.create({
          type: "MESSAGE",
          name,
        })
      },

      matchesInteraction: (interaction) =>
        interaction.isContextMenu() &&
        interaction.targetType === "MESSAGE" &&
        interaction.commandName === name,

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
    }),
  )
}
