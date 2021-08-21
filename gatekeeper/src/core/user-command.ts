import type * as Discord from "discord.js"
import { createActionQueue } from "../internal/action-queue"
import { isAnyObject } from "../internal/helpers"
import type { Logger } from "../internal/logger"
import type { OptionalKeys } from "../internal/types"
import type { InteractionContext } from "./interaction-context"
import { createInteractionContext } from "./interaction-context"

export type UserCommandDefinition = {
  __type: typeof userCommandType
  name: string
  run: (context: UserCommandInteractionContext) => void | Promise<unknown>
}

type UserCommandDefinitionWithoutType = OptionalKeys<
  UserCommandDefinition,
  "__type"
>

export type UserCommandInteractionContext = InteractionContext & {
  targetUser: Discord.User
  targetGuildMember: Discord.GuildMember | undefined
}

const userCommandType = Symbol("userCommand")

export function defineUserCommand(
  definition: UserCommandDefinitionWithoutType,
): UserCommandDefinition {
  return { ...definition, __type: userCommandType }
}

export function isUserCommandDefinition(
  definition: unknown,
): definition is UserCommandDefinition {
  return isAnyObject(definition) && definition.__type === userCommandType
}

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
