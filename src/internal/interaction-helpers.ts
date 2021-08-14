import type {
  CommandInteraction,
  InteractionReplyOptions,
  Message,
  MessageComponentInteraction,
} from "discord.js"
import type { ComponentInteraction } from "../core/command-handler.js"

export function editOrCreateReply(
  interaction: CommandInteraction | MessageComponentInteraction,
  reply: InteractionReplyOptions
): Promise<Message> {
  const messagePromise = (() => {
    if (interaction.deferred) {
      return interaction.editReply(reply)
    }
    if (interaction.replied) {
      return interaction.editReply(reply)
    }
    if (interaction.isMessageComponent()) {
      return interaction.update({ ...reply, fetchReply: true })
    }
    return interaction.reply({ ...reply, fetchReply: true })
  })()

  return messagePromise as Promise<Message>
}

export function addOrCreateReply(
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

export function getComponentInteractionInfo(
  interaction: MessageComponentInteraction
): ComponentInteraction {
  return {
    customId: interaction.customId,
    values: interaction.isSelectMenu() ? interaction.values : [],
    defer: () => interaction.deferUpdate(),
  }
}
