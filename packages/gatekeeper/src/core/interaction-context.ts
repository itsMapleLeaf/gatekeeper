import type * as Discord from "discord.js"
import type { ActionQueue, createActionQueue } from "../internal/action-queue"
import type { Logger } from "../internal/logger"
import { createTimeout } from "../internal/timeout"
import type { ButtonComponent } from "./button-component"
import type {
  RenderReplyFn,
  RenderResult,
  TopLevelComponent,
} from "./reply-component"
import {
  createInteractionReplyOptions,
  flattenRenderResult,
} from "./reply-component"
import type { SelectMenuComponent } from "./select-menu-component"

/**
 * An interaction can happen in multiple ways:
 * - A command is ran
 * - A button is clicked
 * - A select menu option is selected
 *
 * This object provides info on that interaction,
 * as well as functions to handle it.
 */
export type InteractionContext = {
  /**
   * The channel the interaction happened in
   */
  channel: Discord.TextBasedChannels | undefined

  /**
   * The user that performed the interaction.
   * For slash commands, this is the user that ran the command.
   * For buttons, this is the user that clicked the button.
   */
  user: Discord.User

  /**
   * The guild (server) the interaction happened in.
   * If not in a guild (e.g. a DM), this is undefined.
   */
  guild: Discord.Guild | undefined

  /**
   * The guild member that performed the interaction.
   * If outside of a guild (e.g. in a DM), this will be undefined.
   */
  member: Discord.GuildMember | undefined

  /**
   * Create a new message in response to the interaction.
   * This message can be seen by everyone in the corresponding channel.
   *
   * @return A {@link ReplyHandle handle} that can be used delete the message,
   * or refresh its contents.
   */
  reply: (render: RenderReplyFn) => ReplyHandle

  /**
   * Create an ephemeral message in response to the interaction.
   * This message can only be seen by the user that performed the interaction.
   *
   * Does not return a {@link ReplyHandle handle};
   * ephemeral messages can't be arbitrarily updated or deleted
   * outside of interactions updates.
   */
  ephemeralReply: (render: RenderReplyFn) => void

  /**
   * Defer a response, which shows a loading message until reply() is called.
   * Call this if your command might take longer than 3 seconds to reply.
   * More details: https://discordjs.guide/interactions/replying-to-slash-commands.html#deferred-responses
   */
  defer: () => void

  /**
   * Like `defer()`, but the loading message will only be shown to the user that ran the command.
   */
  ephemeralDefer: () => void
}

/**
 * Returned from {@link InteractionContext.reply}.
 * Use this to manually refresh or delete a reply.
 *
 * ```js
 * let seconds = 0
 *
 * const reply = context.reply(() => [
 *   `${seconds} seconds have passed`,
 *   buttonComponent({
 *     label: "stop",
 *     style: "SECONDARY",
 *     onClick: () => {
 *       reply.delete()
 *       clearInterval(interval)
 *     },
 *   }),
 * ])
 *
 * const interval = setInterval(() => {
 *   seconds += 1
 *   reply.refresh()
 * }, 1000)
 * ```
 */
export type ReplyHandle = {
  /**
   * Refresh the reply. Useful for updates outside of button/select interactions.
   */
  refresh: () => void
  delete: () => void
}

type ReplyState = {
  render: RenderReplyFn
  components: TopLevelComponent[]
  message: Discord.Message | undefined
}

const deferPriority = 0
const updatePriority = 1

/**
 * @internal
 */
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

    ephemeralDefer: () => {
      actionQueue.push({
        name: "defer",
        priority: deferPriority,
        run: async () => {
          if (interaction.deferred) return
          if (interaction.isCommand())
            await interaction.deferReply({ ephemeral: true })
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
              if (!state.message) return

              state.components = flattenRenderResult(render())
              const replyOptions = createInteractionReplyOptions(
                state.components,
              )

              await state.message.edit(replyOptions)
            },
          })
        },

        delete: () => {
          handler.removeListener()

          actionQueue.push({
            name: "deleteInteractionReply",
            async run() {
              if (!state.message) return

              const message = state.message
              state.message = undefined
              await message.delete()
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

        if (!componentInteraction.replied && !componentInteraction.deferred) {
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

async function addReply(
  interaction: Discord.CommandInteraction | Discord.MessageComponentInteraction,
  options: Discord.InteractionReplyOptions,
) {
  if (interaction.deferred && interaction.ephemeral) {
    // edge case: if the reply is deferred and ephemeral,
    // calling followUp will edit the ephemeral loading message
    // instead of creating a new public message,
    // so we have to create this public message manually for now
    // instead of using reply functions
    return interaction.channel?.send(options) as Promise<Discord.Message>
  }

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
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ ...options, ephemeral: true })
  } else {
    await interaction.reply({ ...options, ephemeral: true })
  }
}

function getInteractiveComponents(
  result: RenderResult,
): Array<ButtonComponent | SelectMenuComponent> {
  return flattenRenderResult(result)
    .flatMap((component) =>
      component.type === "actionRow" ? component.children : [],
    )
    .filter(
      (component): component is ButtonComponent | SelectMenuComponent =>
        component.type === "button" || component.type === "selectMenu",
    )
}
