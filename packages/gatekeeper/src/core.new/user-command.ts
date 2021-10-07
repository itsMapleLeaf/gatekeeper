import type { Command } from "./command"

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
  run: (context: {}) => void | Promise<unknown>
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
  }
}
