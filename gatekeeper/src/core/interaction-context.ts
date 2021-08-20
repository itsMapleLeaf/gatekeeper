import type * as Discord from "discord.js"
import type { ActionQueue, createActionQueue } from "../internal/action-queue"
import type { Logger } from "../internal/logger"
import { createTimeout } from "../internal/timeout"
import type { RenderReplyFn, ReplyComponent } from "./reply-component"
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

  defer: () => void
}

type ReplyState = {
  render: RenderReplyFn
  components: ReplyComponent[]
  message: Discord.Message | undefined
}

const deferPriority = 0
const updatePriority = 1

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

    defer: () => {
      actionQueue.push({
        name: "defer",
        priority: deferPriority,
        run: async () => {
          if (interaction.deferred) return
          if (interaction.isCommand()) await interaction.deferReply()
          if (interaction.isMessageComponent()) await interaction.deferUpdate()
        },
      })
    },

    reply: (render) => {
      const state: ReplyState = {
        components: flattenRenderResult(render()),
        render,
        message: undefined,
      }

      actionQueue.push({
        name: "createMessage",
        async run() {
          state.message = await addReply(
            interaction,
            createInteractionReplyOptions(state.components),
          )
        },
      })

      const handler = createMessageComponentInteractionHandler(
        interaction,
        state,
        logger,
        actionQueue,
      )

      return {
        refresh: () => {
          actionQueue.push({
            name: "refreshMessage",
            async run() {
              state.components = flattenRenderResult(render())
              const replyOptions = createInteractionReplyOptions(
                state.components,
              )

              await state.message?.edit(replyOptions)
            },
          })
        },

        delete: () => {
          handler.removeListener()

          actionQueue.push({
            name: "deleteInteractionReply",
            async run() {
              await state.message?.delete()
            },
          })
        },
      }
    },

    ephemeralReply: (render) => {
      const state: ReplyState = {
        components: flattenRenderResult(render()),
        render,
        message: undefined,
      }

      actionQueue.push({
        name: "createEphemeralMessage",
        async run() {
          await addEphemeralReply(
            interaction,
            createInteractionReplyOptions(state.components),
          )
        },
      })

      createMessageComponentInteractionHandler(
        interaction,
        state,
        logger,
        actionQueue,
      )
    },
  }

  return context
}

async function addReply(
  interaction: Discord.CommandInteraction | Discord.MessageComponentInteraction,
  options: Discord.InteractionReplyOptions,
) {
  if (interaction.deferred) {
    return interaction.editReply(options) as Promise<Discord.Message>
  }

  if (interaction.replied) {
    return interaction.followUp(options) as Promise<Discord.Message>
  }

  return interaction.reply({
    ...options,
    fetchReply: true,
  }) as Promise<Discord.Message>
}

async function addEphemeralReply(
  interaction: Discord.CommandInteraction | Discord.MessageComponentInteraction,
  options: Discord.InteractionReplyOptions,
) {
  if (interaction.deferred) {
    await interaction.editReply(options)
    return
  }

  if (interaction.replied) {
    await interaction.followUp({ ...options, ephemeral: true })
    return
  }

  await interaction.reply({ ...options, ephemeral: true })
}

function createMessageComponentInteractionHandler(
  interaction: Discord.Interaction,
  replyState: ReplyState,
  logger: Logger,
  actionQueue: ActionQueue,
) {
  interaction.client.on("interactionCreate", handleComponentInteraction)

  // ensure the listener is removed after 15min,
  // the max amount of time an interaction can be active
  const removeListenerTimeout = createTimeout(15 * 60 * 1000, () => {
    interaction.client.off("interactionCreate", handleComponentInteraction)
  })

  function handleComponentInteraction(
    componentInteraction: Discord.Interaction,
  ) {
    if (!componentInteraction.isMessageComponent()) return
    if (!callInteractedComponent(componentInteraction)) return

    // replies count as an update, therefore we can't actually call update() after making a reply
    // in order to ensure updates happen, we queue them as priority 0
    // so they happen first, before replies
    actionQueue.push({
      name: "updateAfterInteraction",
      priority: updatePriority,
      async run() {
        replyState.components = flattenRenderResult(replyState.render())
        const replyOptions = createInteractionReplyOptions(
          replyState.components,
        )

        if (!componentInteraction.replied) {
          await componentInteraction
            .update(replyOptions)
            .catch((error) => logger.warn("Failed to call update:", error))
        } else {
          replyState.message?.edit(replyOptions)
        }
      },
    })
  }

  function callInteractedComponent(
    componentInteraction: Discord.MessageComponentInteraction,
  ): boolean {
    const component = getInteractiveComponents(replyState.components).find(
      (component) => component.customId === componentInteraction.customId,
    )
    if (!component) return false

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

    removeListenerTimeout.reset()

    return true
  }

  return {
    removeListener() {
      removeListenerTimeout.trigger()
    },
  }
}
