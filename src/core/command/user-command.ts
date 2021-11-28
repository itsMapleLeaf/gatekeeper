import type { GuildMember, User } from "discord.js"
import { raise } from "../../internal/helpers"
import type { InteractionContext } from "../interaction-context"
import { createInteractionContext } from "../interaction-context"
import type { Command } from "./command"
import { createCommand } from "./command"

/**
 * Options for creating a user command. Shows when right-clicking on a user.
 * @see Gatekeeper.addUserCommand
 */
export type UserCommandConfig = {
  /**
   * The name of the command. This shows up in the context menu for users.
   */
  name: string

  /** Aliases: alternate names to call this command with */
  aliases?: string[]

  /**
   * The function to call when the command is ran.
   */
  run: (context: UserCommandInteractionContext) => void | Promise<unknown>
}

export type UserCommandInteractionContext = InteractionContext & {
  /** The user that the command was run on */
  readonly targetUser: User

  /** If in a guild (server), the guild member for the user */
  readonly targetGuildMember: GuildMember | undefined
}

export function createUserCommands(config: UserCommandConfig): Command[] {
  const names = [config.name, ...(config.aliases || [])]

  return names.map((name) =>
    createCommand({
      name,

      matchesExisting: (appCommand) => {
        return appCommand.name === name && appCommand.type === "USER"
      },

      register: async (commandManager) => {
        await commandManager.create({
          name,
          type: "USER",
        })
      },

      matchesInteraction: (interaction) =>
        interaction.isContextMenu() &&
        interaction.targetType === "USER" &&
        interaction.commandName === name,

      run: async (interaction, command) => {
        const isUserInteraction =
          interaction.isContextMenu() && interaction.targetType === "USER"

        if (!isUserInteraction)
          raise("Expected a context menu user interaction")

        const targetUser = await interaction.client.users.fetch(
          interaction.targetId,
        )

        const targetGuildMember = await interaction.guild?.members.fetch({
          user: targetUser,
        })

        await config.run({
          ...createInteractionContext({ interaction, command }),
          targetUser,
          targetGuildMember,
        })
      },
    }),
  )
}
