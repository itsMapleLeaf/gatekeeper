import type {
  CommandInteraction,
  GuildMember,
  InteractionReplyOptions,
  Message,
  MessageComponentInteraction,
} from "discord.js"
import { isObject } from "../internal/helpers.js"
import {
  createInteractionReplyOptions,
  ReplyComponent,
  ReplyComponentOfType,
} from "./reply-component.js"
import type { ReplyManager } from "./reply-instance.js"

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

type RenderReplyFn = () => ReplyComponent[] | undefined

export type CommandHandlerContext = {
  member: GuildMember
  createReply: (render: RenderReplyFn) => Promise<CommandReplyHandle>
  createEphemeralReply: (
    render: RenderReplyFn,
  ) => Promise<EphemeralCommandReplyHandle>
  // defer: () => Promise<CommandReply>
}

export type ReplyInstance = {
  handleMessageComponentInteraction(
    interaction: MessageComponentInteraction,
  ): Promise<void>
}

export type EphemeralCommandReplyHandle = {
  update: () => Promise<void>
}

export type CommandReplyHandle = EphemeralCommandReplyHandle & {
  delete: () => Promise<void>
}

const isActionRow = (
  component: ReplyComponent,
): component is ReplyComponentOfType<"actionRow"> =>
  isObject(component) && component.type === "actionRow"

export function createCommandHandlerContext(
  interaction: CommandInteraction,
  member: GuildMember,
  replyManager: ReplyManager,
): CommandHandlerContext {
  return {
    member,

    async createReply(render) {
      let components = render()
      if (!components) {
        return {
          async delete() {},
          async update() {},
        }
      }

      const message = (await addReply(
        interaction,
        createInteractionReplyOptions(components),
      )) as Message

      async function rerender() {
        components = render()
        if (components) {
          await message.edit(createInteractionReplyOptions(components))
        } else {
          replyManager.remove(instance)
          try {
            await message.delete()
          } catch {}
        }
      }

      const instance = replyManager.add({
        async handleMessageComponentInteraction(
          interaction: MessageComponentInteraction,
        ) {
          const matchingComponents = components
            ?.filter(isActionRow)
            .flatMap((c) => c.children)
            .filter((c) => c.customId === interaction.customId)

          if (!matchingComponents?.length) return

          for (const component of matchingComponents ?? []) {
            if (component.type === "button" && interaction.isButton()) {
              await component.onClick()
            }

            if (component.type === "selectMenu" && interaction.isSelectMenu()) {
              await component.onSelect(interaction.values)
            }
          }

          await rerender()
        },
      })

      return {
        async delete() {
          replyManager.remove(instance)
          try {
            await message.delete()
          } catch {}
        },
        async update() {
          await rerender()
        },
      }
    },

    async createEphemeralReply(render) {
      let components = render()
      if (!components) {
        return {
          async update() {},
        }
      }

      const options = {
        ...createInteractionReplyOptions(components),
        ephemeral: true,
      }

      if (interaction.replied) {
        await interaction.followUp(options)
        return {
          async update() {
            console.warn(
              "Ephemeral followup replies can't be updated - blame discord 🙃",
            )
          },
        }
      }

      await interaction.reply(options)

      async function rerender() {
        components = render()

        if (!components) {
          replyManager.remove(instance)
          return
        }

        return interaction.editReply(createInteractionReplyOptions(components))
      }

      const instance = replyManager.add({
        async handleMessageComponentInteraction(
          interaction: MessageComponentInteraction,
        ) {
          const matchingComponents = components
            ?.filter(isActionRow)
            .flatMap((c) => c.children)
            .filter((c) => c.customId === interaction.customId)

          if (!matchingComponents?.length) return

          for (const component of matchingComponents ?? []) {
            if (component.type === "button" && interaction.isButton()) {
              await component.onClick()
            }

            if (component.type === "selectMenu" && interaction.isSelectMenu()) {
              await component.onSelect(interaction.values)
            }
          }

          await rerender()
        },
      })

      return {
        async update() {
          await rerender()
        },
      }
    },
  }
}

function addReply(
  interaction: CommandInteraction | MessageComponentInteraction,
  options: InteractionReplyOptions,
) {
  if (interaction.replied) return interaction.followUp(options)
  return interaction.reply({ ...options, fetchReply: true })
}
