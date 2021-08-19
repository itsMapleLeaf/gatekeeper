import type * as Discord from "discord.js"
import type { RenderResult } from "./reply-component"
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

  reply: (content: RenderResult<unknown>) => Promise<{
    edit: (content: RenderResult<unknown>) => Promise<void>
    delete: () => Promise<void>
  }>

  ephemeralReply: (content: RenderResult<unknown>) => Promise<void>

  statefulReply: <State>(options: {
    state: State
    render: (state: State) => RenderResult<State>
  }) => Promise<void>
}

export function createInteractionContext(
  interaction: Discord.CommandInteraction | Discord.MessageComponentInteraction,
): InteractionContext {
  const context: InteractionContext = {
    channel: interaction.channel ?? undefined,
    member: (interaction.member as Discord.GuildMember | null) ?? undefined,
    user: interaction.user,
    guild: interaction.guild ?? undefined,

    reply: async (result: RenderResult<unknown>) => {
      const options = createInteractionReplyOptions(flattenRenderResult(result))
      const message = await addReply(interaction, options)

      return {
        edit: async (newResult: RenderResult<unknown>) => {
          await message.edit(
            createInteractionReplyOptions(flattenRenderResult(newResult)),
          )
        },
        async delete() {
          await message.delete()
        },
      }
    },

    ephemeralReply: async (result) => {
      await addEphemeralReply(result, interaction)
    },

    statefulReply: async (options) => {
      let state = options.state
      let components = flattenRenderResult(options.render(state))

      const replyOptions = createInteractionReplyOptions(components)
      await addReply(interaction, replyOptions)

      const handleComponentInteraction = (
        componentInteraction: Discord.Interaction,
      ) => {
        console.log(
          `received interaction from ${
            (componentInteraction.member as Discord.GuildMember).displayName ||
            componentInteraction.user.username
          }`,
        )

        if (!componentInteraction.isMessageComponent()) return

        const component = getInteractiveComponents(components).find(
          (component) => component.customId === componentInteraction.customId,
        )
        if (!component) return

        if (component.type === "button") {
          component.onClick({
            ...createInteractionContext(componentInteraction),

            setState: async (getNewState) => {
              state = getNewState(state)
              components = flattenRenderResult(options.render(state))
              const replyOptions = createInteractionReplyOptions(components)

              if (!componentInteraction.replied) {
                await componentInteraction
                  .update(replyOptions)
                  .catch(console.warn)
              } else {
                await interaction.editReply(replyOptions).catch(console.warn)
              }
            },
          })
        }
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
  result: RenderResult<unknown>,
  interaction: Discord.CommandInteraction | Discord.MessageComponentInteraction,
) {
  const options = {
    ...createInteractionReplyOptions(flattenRenderResult(result)),
    ephemeral: true,
  }

  interaction.replied
    ? await interaction.followUp(options)
    : await interaction.reply(options)
}
