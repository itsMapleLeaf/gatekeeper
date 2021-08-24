import type * as Discord from "discord.js"
import { createActionQueue } from "../internal/action-queue"
import { isAnyObject, raise } from "../internal/helpers"
import type { Logger } from "../internal/logger"
import type { InteractionContext } from "./interaction-context"
import { createInteractionContext } from "./interaction-context"

/**
 * Options for defining a message context menu command.
 */
export type MessageCommandDefinitionOptions = {
  /**
   * Name of the message command, shows up when you right-click on a message in Discord.
   */
  name: string

  /**
   * Function to run when the command is invoked.
   */
  run: (context: MessageCommandInteractionContext) => void | Promise<unknown>
}

/**
 * @see defineMessageCommand
 */
export type MessageCommandDefinition = MessageCommandDefinitionOptions & {
  __type: typeof messageCommandType
}

/**
 * Interaction context for a message context menu command.
 */
export type MessageCommandInteractionContext = InteractionContext & {
  /**
   * The message that the command was run on.
   * @see defineMessageCommand
   */
  targetMessage: Discord.Message
}

const messageCommandType = Symbol("messageCommand")

/**
 * Define a context menu command, available when right clicking on messages.
 * You still need to add it yourself: {@link GatekeeperInstance.addCommand}
 *
 * ```js
 * const reverseCommand = defineMessageCommand({
 *   name: "reverse message content",
 *   run(context) {
 *     context.reply(() =>
 *       context.targetMessage.content.split("").reverse().join(""),
 *     )
 *   },
 * })
 * ```
 */
export function defineMessageCommand(
  definition: MessageCommandDefinitionOptions,
): MessageCommandDefinition {
  return { ...definition, __type: messageCommandType }
}

/**
 * @internal
 */
export function isMessageCommandDefinition(
  definition: unknown,
): definition is MessageCommandDefinition {
  return isAnyObject(definition) && definition.__type === messageCommandType
}

/**
 * @internal
 */
export async function createMessageCommandContext(
  interaction: Discord.ContextMenuInteraction,
  logger: Logger,
): Promise<MessageCommandInteractionContext> {
  const actionQueue = createActionQueue(logger)

  const targetMessage =
    (await interaction.channel?.messages.fetch(interaction.targetId)) ??
    raise("Target message not found")

  return {
    ...createInteractionContext(interaction, logger, actionQueue),
    targetMessage,
  }
}
