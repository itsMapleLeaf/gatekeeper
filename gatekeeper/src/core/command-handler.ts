import type {
  CommandInteraction,
  GuildMember,
  InteractionReplyOptions,
  Message,
  MessageComponentInteraction,
} from "discord.js"
import type { AsyncQueue } from "../internal/async-queue.js"
import { isObject } from "../internal/helpers.js"
import {
  ActionRowChild,
  processReplyComponents,
  ReplyComponent,
  ReplyComponentArgs,
  ReplyComponentOfType,
} from "./reply-component.js"

export type ComponentInteraction = {
  customId: string
  values: string[]
  defer: () => Promise<void>
}

export type CommandHandler = {
  name: string
  description: string
  run: (context: CommandHandlerContext) => void | Promise<unknown>
}

export type CommandHandlerContext = {
  member: GuildMember
  addReply: (...components: ReplyComponentArgs) => Promise<CommandReply>
  addEphemeralReply: (
    ...components: ReplyComponentArgs
  ) => Promise<EphemeralCommandReply>
  defer: () => Promise<CommandReply>
}

export type EphemeralCommandReply = {
  edit: (...components: ReplyComponentArgs) => Promise<void>
}

export type CommandReply = EphemeralCommandReply & {
  delete: () => Promise<void>
}

const isActionRow = (
  c: ReplyComponent
): c is ReplyComponentOfType<"actionRow"> =>
  isObject(c) && c.type === "actionRow"

export function createCommandHandlerContext(
  interaction: CommandInteraction,
  member: GuildMember,
  interactionQueue: AsyncQueue<MessageComponentInteraction>
): CommandHandlerContext {
  return {
    member,

    async addReply(...components) {
      const processResult = processReplyComponents(components)

      const message = await addOrCreateReply(
        interaction,
        processResult.replyOptions
      )

      await handleMessageComponentInteraction(
        processResult.messageComponentIds,
        interactionQueue
      )

      return {
        async edit(...components) {
          const processResult = processReplyComponents(components)

          await message.edit(processResult.replyOptions)

          await handleMessageComponentInteraction(
            processResult.messageComponentIds,
            interactionQueue
          )
        },
        async delete() {
          await message.delete()
        },
      }
    },

    async addEphemeralReply(...components) {
      const processResult = processReplyComponents(components)

      const message = await addOrCreateReply(interaction, {
        ...processReplyComponents(components),
        ephemeral: true,
      })

      await handleMessageComponentInteraction(
        processResult.messageComponentIds,
        interactionQueue
      )

      return {
        async edit(...components) {
          const processResult = processReplyComponents(components)

          await message.edit(processResult.replyOptions)

          await handleMessageComponentInteraction(
            processResult.messageComponentIds,
            interactionQueue
          )
        },
      }
    },

    async defer() {
      await interaction.deferReply({
        fetchReply: true,
      })

      return {
        async edit(...components) {
          const processResult = processReplyComponents(components)

          await interaction.editReply(processResult.replyOptions)

          await handleMessageComponentInteraction(
            processResult.messageComponentIds,
            interactionQueue
          )
        },
        async delete() {
          await interaction.deleteReply()
        },
      }
    },
  }
}

async function handleMessageComponentInteraction(
  messageComponentIds: Map<ActionRowChild, string>,
  interactionQueue: AsyncQueue<MessageComponentInteraction>
) {
  if (messageComponentIds.size > 0) {
    const messageInteraction = await interactionQueue.pop()

    const interactedComponents = [...messageComponentIds]
      .filter(([, id]) => id === messageInteraction.customId)
      .map(([component]) => component)

    for (const component of interactedComponents) {
      if (component.type === "button") {
        component.onClick()
      }
      if (
        component.type === "selectMenu" &&
        messageInteraction.isSelectMenu()
      ) {
        component.onSelect(messageInteraction.values)
      }
    }
  }
}

function addOrCreateReply(
  interaction: CommandInteraction | MessageComponentInteraction,
  reply: InteractionReplyOptions
): Promise<Message> {
  const messagePromise = (() => {
    if (interaction.deferred) return interaction.editReply(reply)
    if (interaction.replied) return interaction.followUp(reply)
    return interaction.reply({ ...reply, fetchReply: true })
  })()

  return messagePromise as Promise<Message>
}
