import type {
  CommandInteraction,
  GuildMember,
  InteractionReplyOptions,
  Message,
  MessageComponentInteraction,
} from "discord.js"
import { inspect } from "util"
import { isObject } from "../internal/helpers.js"
import {
  createInteractionReplyOptions,
  ReplyComponent,
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
  createReply: (
    render: () => ReplyComponent[] | undefined,
  ) => Promise<CommandReplyHandle>
  createEphemeralReply: (
    render: () => ReplyComponent[] | undefined,
  ) => Promise<CommandReplyHandle>
  // defer: () => Promise<CommandReply>
}

export type CommandReplyInstance = {
  handleMessageComponentInteraction(
    interaction: MessageComponentInteraction,
  ): Promise<void>
}

export type EphemeralCommandReplyHandle = {
  delete: () => Promise<void>
}

export type CommandReplyHandle = EphemeralCommandReplyHandle & {}

const isActionRow = (
  component: ReplyComponent,
): component is ReplyComponentOfType<"actionRow"> =>
  isObject(component) && component.type === "actionRow"

export function createCommandHandlerContext(
  interaction: CommandInteraction,
  member: GuildMember,
  instances: Set<CommandReplyInstance>,
): CommandHandlerContext {
  return {
    member,

    async createReply(render) {
      let components = render()
      console.log("components", inspect(components, { depth: undefined }))
      if (!components) {
        return { async delete() {} }
      }

      const message = (await addReply(
        interaction,
        createInteractionReplyOptions(components),
      )) as Message

      const instance: CommandReplyInstance = {
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

          components = render()
          if (components) {
            await message.edit(createInteractionReplyOptions(components))
          } else {
            instances.delete(instance)
            try {
              await message.delete()
            } catch {}
          }
        },
      }

      instances.add(instance)

      return {
        async delete() {
          instances.delete(instance)
          try {
            await message.delete()
          } catch {}
        },
      }
    },

    async createEphemeralReply(...components) {
      throw new Error("not implemented")
    },

    // async defer() {
    //   await interaction.deferReply()
    //   return {
    //     async edit(...components) {
    //       await interaction.editReply(processReplyComponents(components))
    //       await handleMessageComponentInteraction(components, instances)
    //     },
    //     async delete() {
    //       await interaction.deleteReply()
    //     },
    //   }
    // },
  }
}

// async function handleMessageComponentInteraction(
//   components: ReplyComponentArgs,
//   instances: Set<CommandInstance>,
// ) {
//   const actionRowComponents = components
//     .filter(isActionRow)
//     .flatMap((c) => c.children)

//   if (actionRowComponents.length > 0) {
//     await new Promise<void>((resolve) => {
//       instances.add({
//         components: actionRowComponents,
//         resolve,
//       })
//     })
//   }
// }

function addReply(
  interaction: CommandInteraction | MessageComponentInteraction,
  reply: InteractionReplyOptions,
) {
  if (interaction.replied) return interaction.followUp(reply)
  return interaction.reply({ ...reply, fetchReply: true })
}
