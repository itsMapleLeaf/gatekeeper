import type * as Discord from "discord.js"
import type { Logger } from "../internal/logger"
import type { RenderReplyFn } from "./reply-component"
import {
  createInteractionReplyOptions,
  flattenRenderResult,
  getInteractiveComponents,
} from "./reply-component"

export type InteractionContext = {
  channel: Discord.TextBasedChannels | undefined
  member: Discord.GuildMember | undefined
  user: Discord.User
  guild: Discord.Guild | undefined

  reply: (render: RenderReplyFn) => Promise<{
    refresh: () => Promise<void>
    delete: () => Promise<void>
  }>

  ephemeralReply: (render: RenderReplyFn) => Promise<void>

  /**
   * internal do not use
   */
  flushReplyQueue: () => Promise<void>
}

export function createInteractionContext(
  interaction: Discord.CommandInteraction | Discord.MessageComponentInteraction,
  logger: Logger,
): InteractionContext {
  // this reply queue exists so we can control _when_ reply messages are actually created
  // this is useful for message interactions:
  // replies count as an update, therefore we can't actually call update() after making a reply
  // so in order to accomplish that, we'll queue the replies we want to make,
  // then flush them all after the update
  const replyQueue: Discord.InteractionReplyOptions[] = []

  const context: InteractionContext = {
    channel: interaction.channel ?? undefined,
    member: (interaction.member as Discord.GuildMember | null) ?? undefined,
    user: interaction.user,
    guild: interaction.guild ?? undefined,

    flushReplyQueue: async () => {
      let replyOptions = replyQueue.shift()
      while (replyOptions) {
        await addReply(interaction, replyOptions)
        replyOptions = replyQueue.shift()
      }
    },

    // eslint-disable-next-line @typescript-eslint/require-await
    reply: async (render) => {
      let components = flattenRenderResult(render())

      const message = replyQueue.push(createInteractionReplyOptions(components))

      const handleComponentInteraction = async (
        componentInteraction: Discord.Interaction,
      ) => {
        if (!componentInteraction.isMessageComponent()) return

        const component = getInteractiveComponents(components).find(
          (component) => component.customId === componentInteraction.customId,
        )
        if (!component) return

        const componentContext = createInteractionContext(
          componentInteraction,
          logger,
        )

        if (component.type === "button") {
          await component.onClick(componentContext)
        }

        if (
          component.type === "selectMenu" &&
          componentInteraction.isSelectMenu()
        ) {
          await component.onSelect({
            ...componentContext,
            values: componentInteraction.values,
          })
        }

        components = flattenRenderResult(render())
        const replyOptions = createInteractionReplyOptions(components)

        if (!componentInteraction.replied) {
          await componentInteraction
            .update(replyOptions)
            .catch((error) => logger.warn("Failed to add reply:", error))
          return
        }

        const componentMessage = componentInteraction.message as Discord.Message
        if (!componentMessage.editable) {
          logger.warn(
            `Could not edit message ${componentMessage.id} because it is not editable`,
          )
          return
        }

        await componentMessage.edit(replyOptions).catch((error) => {
          logger.warn("Failed to edit message:", error)
        })

        await componentContext.flushReplyQueue()
      }

      interaction.client.on("interactionCreate", handleComponentInteraction)

      return {
        refresh: async () => {
          components = flattenRenderResult(render())
          const replyOptions = createInteractionReplyOptions(components)
          if (interaction.isCommand()) {
            await interaction.editReply(replyOptions)
          }
          if (interaction.isMessageComponent()) {
            await (interaction.message as Discord.Message).edit(replyOptions)
          }
        },

        delete: async () => {
          interaction.client.off(
            "interactionCreate",
            handleComponentInteraction,
          )
          if (interaction.isCommand()) {
            await interaction.deleteReply()
          }
          if (interaction.isMessageComponent()) {
            await (interaction.message as Discord.Message).delete()
          }
        },
      }
    },

    ephemeralReply: async (render) => {
      let components = flattenRenderResult(render())

      replyQueue.push({
        ...createInteractionReplyOptions(components),
      })

      await addEphemeralReply(
        interaction,
        createInteractionReplyOptions(components),
      )

      const handleComponentInteraction = async (
        componentInteraction: Discord.Interaction,
      ) => {
        if (!componentInteraction.isMessageComponent()) return

        const component = getInteractiveComponents(components).find(
          (component) => component.customId === componentInteraction.customId,
        )
        if (!component) return

        if (component.type === "button") {
          await component.onClick(
            createInteractionContext(componentInteraction, logger),
          )
        }

        components = flattenRenderResult(render())
        const replyOptions = createInteractionReplyOptions(components)

        if (!componentInteraction.replied) {
          await componentInteraction
            .update(replyOptions)
            .catch((error) => logger.warn("Failed to add reply:", error))
          return
        }

        const componentMessage = componentInteraction.message as Discord.Message
        if (!componentMessage.editable) {
          logger.warn(
            `Could not edit message ${componentMessage.id} because it is not editable`,
          )
          return
        }

        logger.warn(
          "Attempted to edit an ephemeral message after sending a reply. Discord doesn't allow this 🙃",
        )
      }

      interaction.client.on("interactionCreate", handleComponentInteraction)
    },
  }

  return context
}

async function addReply(
  interaction: Discord.CommandInteraction | Discord.MessageComponentInteraction,
  options: Discord.InteractionReplyOptions,
) {
  return (
    interaction.replied
      ? await interaction.followUp(options)
      : await interaction.reply({ ...options, fetchReply: true })
  ) as Discord.Message
}

async function addEphemeralReply(
  interaction: Discord.CommandInteraction | Discord.MessageComponentInteraction,
  options: Discord.InteractionReplyOptions,
) {
  interaction.replied
    ? await interaction.followUp({ ...options, ephemeral: true })
    : await interaction.reply({ ...options, ephemeral: true })
}
