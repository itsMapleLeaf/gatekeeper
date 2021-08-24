import type * as Discord from "discord.js"
import { createActionQueue } from "../internal/action-queue"
import { isAnyObject } from "../internal/helpers"
import type { Logger } from "../internal/logger"
import type { InteractionContext } from "./interaction-context"
import { createInteractionContext } from "./interaction-context"

/**
 * Options for creating a user command.
 * @see defineUserCommand
 */
export type UserCommandDefinitionOptions = {
  /**
   * The name of the command. This shows up in the context menu for users.
   */
  name: string
  /**
   * The function to call when the command is ran.
   */
  run: (context: UserCommandInteractionContext) => void | Promise<unknown>
}

/**
 * @see defineUserCommand
 */
export type UserCommandDefinition = UserCommandDefinitionOptions & {
  /**
   * @internal
   */
  __type: typeof userCommandType
}

export type UserCommandInteractionContext = InteractionContext & {
  /**
   * The user on which the command was ran.
   */
  targetUser: Discord.User

  /**
   * If in a guild (server), the guild member for the user
   */
  targetGuildMember: Discord.GuildMember | undefined
}

const userCommandType = Symbol("userCommand")

/**
 * Defines a context menu command, available when right-clicking on a user.
 *
 * ```js
 * const hugCommand = defineUserCommand({
 *   name: "hug",
 *   run(context) {
 *     const user = `<@${context.user.id}>`
 *     const target = `<@${context.targetUser.id}>`
 *     context.reply(() => `${user} gave ${target} a hug!`)
 *   },
 * })
 * ```
 */
export function defineUserCommand(
  definition: UserCommandDefinitionOptions,
): UserCommandDefinition {
  return { ...definition, __type: userCommandType }
}

/**
 * @internal
 */
export function isUserCommandDefinition(
  definition: unknown,
): definition is UserCommandDefinition {
  return isAnyObject(definition) && definition.__type === userCommandType
}

/**
 * @internal
 */
export async function createUserCommandContext(
  interaction: Discord.ContextMenuInteraction,
  logger: Logger,
): Promise<UserCommandInteractionContext> {
  const actionQueue = createActionQueue(logger)

  const targetUser = await interaction.client.users.fetch(
    interaction.targetId,
    {},
  )

  const targetGuildMember = await interaction.guild?.members.fetch({
    user: interaction.targetId,
  })

  return {
    ...createInteractionContext(interaction, logger, actionQueue),
    targetUser,
    targetGuildMember,
  }
}
