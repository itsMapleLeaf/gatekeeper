import type * as Discord from "discord.js"
import type { createActionQueue } from "../internal/action-queue"
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

  reply: (render: RenderReplyFn) => {
    refresh: () => void
    delete: () => void
  }

  ephemeralReply: (render: RenderReplyFn) => void
}

export function createInteractionContext(
  interaction: Discord.CommandInteraction | Discord.MessageComponentInteraction,
  logger: Logger,
  actionQueue: ReturnType<typeof createActionQueue>,
): InteractionContext {
  const context: InteractionContext = {
    channel: interaction.channel ?? undefined,
    member: (interaction.member as Discord.GuildMember | null) ?? undefined,
    user: interaction.user,
    guild: interaction.guild ?? undefined,

    reply: (render) => {
      let components = flattenRenderResult(render())
      let message: Discord.Message | undefined

      actionQueue.push({
        name: "createMessage",
        async run() {
          message = await addReply(
            interaction,
            createInteractionReplyOptions(components),
          )
        },
      })

      function handleComponentInteraction(
        componentInteraction: Discord.Interaction,
      ) {
        if (!componentInteraction.isMessageComponent()) return

        const component = getInteractiveComponents(components).find(
          (component) => component.customId === componentInteraction.customId,
        )
        if (!component) return

        const componentContext = createInteractionContext(
          componentInteraction,
          logger,
          actionQueue,
        )

        if (component.type === "button") {
          component.onClick(componentContext)
        }

        if (
          component.type === "selectMenu" &&
          componentInteraction.isSelectMenu()
        ) {
          component.onSelect({
            ...componentContext,
            values: componentInteraction.values,
          })
        }

        // replies count as an update, therefore we can't actually call update() after making a reply
        // in order to ensure updates happen, we queue them as priority 0
        // so they happen first, before replies
        actionQueue.push({
          name: "updateAfterInteraction",
          priority: 0,
          async run() {
            components = flattenRenderResult(render())
            const replyOptions = createInteractionReplyOptions(components)

            if (!componentInteraction.replied) {
              await componentInteraction
                .update(replyOptions)
                .catch((error) => logger.warn("Failed to call update:", error))
            } else {
              message?.edit(replyOptions)
            }
          },
        })
      }

      interaction.client.on("interactionCreate", handleComponentInteraction)

      return {
        refresh: () => {
          actionQueue.push({
            name: "refreshMessage",
            async run() {
              components = flattenRenderResult(render())
              const replyOptions = createInteractionReplyOptions(components)

              await message?.edit(replyOptions)
            },
          })
        },

        delete: () => {
          interaction.client.off(
            "interactionCreate",
            handleComponentInteraction,
          )

          actionQueue.push({
            name: "deleteInteractionReply",
            async run() {
              await message?.delete()
            },
          })
        },
      }
    },

    ephemeralReply: (render) => {
      let components = flattenRenderResult(render())

      actionQueue.push({
        name: "createEphemeralMessage",
        async run() {
          await addEphemeralReply(
            interaction,
            createInteractionReplyOptions(components),
          )
        },
      })

      function handleComponentInteraction(
        componentInteraction: Discord.Interaction,
      ) {
        if (!componentInteraction.isMessageComponent()) return

        const component = getInteractiveComponents(components).find(
          (component) => component.customId === componentInteraction.customId,
        )
        if (!component) return

        const componentContext = createInteractionContext(
          componentInteraction,
          logger,
          actionQueue,
        )

        if (component.type === "button") {
          component.onClick(componentContext)
        }

        if (
          component.type === "selectMenu" &&
          componentInteraction.isSelectMenu()
        ) {
          component.onSelect({
            ...componentContext,
            values: componentInteraction.values,
          })
        }

        components = flattenRenderResult(render())
        const replyOptions = createInteractionReplyOptions(components)

        if (!componentInteraction.replied) {
          actionQueue.push({
            name: "updateComponentInteraction",
            priority: 0,
            async run() {
              await componentInteraction
                .update(replyOptions)
                .catch((error) => logger.warn("Failed to update:", error))
            },
          })
          return
        }

        const componentMessage = componentInteraction.message as Discord.Message
        if (!componentMessage.editable) {
          logger.warn(
            `Could not edit message ${componentMessage.id} because it is not editable`,
          )
          return
        }

        actionQueue.push({
          name: "editComponentMessage",
          async run() {
            await componentMessage.edit(replyOptions).catch((error) => {
              logger.warn("Failed to edit message:", error)
            })
          },
        })
      }

      interaction.client.on("interactionCreate", handleComponentInteraction)

      // TODO: debounced removal after 15min
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
