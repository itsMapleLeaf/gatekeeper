import type {
  BaseCommandInteraction,
  Message,
  MessageComponentInteraction,
} from "discord.js"
import type { ButtonComponent } from "./button-component"
import type { CommandInstance } from "./command"
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

type ReplyInstanceEvents = {
  onDelete: (instance: ReplyInstance) => void
}

type InteractionSubject = ButtonComponent | SelectMenuComponent

export class ReplyInstance {
  private render: RenderReplyFn
  private renderResult: TopLevelComponent[] = []
  private message?: Message
  private events: ReplyInstanceEvents

  constructor(render: RenderReplyFn, events: ReplyInstanceEvents) {
    this.render = render
    this.events = events
  }

  async createMessage(
    interaction: BaseCommandInteraction | MessageComponentInteraction,
  ) {
    this.renderResult = flattenRenderResult(this.render())
    if (this.renderResult.length === 0) {
      await this.deleteMessage()
      return
    }

    const options = createInteractionReplyOptions(this.renderResult)

    // edge case: if the reply is deferred and ephemeral,
    // calling followUp will edit the ephemeral loading message
    // instead of creating a new public message,
    // so we have to create this public message manually for now
    // instead of using reply functions
    if (interaction.deferred && interaction.ephemeral) {
      this.message = await interaction.channel?.send(options)
      return
    }

    if (interaction.deferred) {
      this.message = (await interaction.editReply(options)) as Message
      return
    }

    if (interaction.replied) {
      this.message = (await interaction.followUp(options)) as Message
      return
    }

    this.message = (await interaction.reply({
      ...options,
      fetchReply: true,
    })) as Message
  }

  async deleteMessage() {
    const message = this.message
    this.message = undefined
    this.events.onDelete(this)
    await message?.delete()
  }

  async refreshMessage() {
    this.renderResult = flattenRenderResult(this.render())
    if (this.renderResult.length === 0) {
      await this.deleteMessage()
      return
    }

    await this.message?.edit(createInteractionReplyOptions(this.renderResult))
  }

  findInteractionSubject(
    interaction: MessageComponentInteraction,
  ): InteractionSubject | undefined {
    return getInteractiveComponents(this.renderResult).find(
      (it) => it.customId === interaction.customId,
    )
  }

  async handleComponentInteraction(
    interaction: MessageComponentInteraction,
    subject: InteractionSubject,
    commandInstance: CommandInstance,
  ) {
    if (interaction.isButton() && subject?.type === "button") {
      await subject?.onClick({
        reply: (render) => commandInstance.createReply(render, interaction),
      })
    }
    if (interaction.isSelectMenu() && subject?.type === "selectMenu") {
      await subject?.onSelect({
        reply: (render) => commandInstance.createReply(render, interaction),
        values: interaction.values,
      })
    }

    // can't call update if it was deferred or replied to
    if (interaction.deferred || interaction.replied) {
      await this.refreshMessage()
      return
    }

    this.renderResult = flattenRenderResult(this.render())
    if (this.renderResult.length === 0) {
      await this.deleteMessage()
      return
    }

    await interaction.update(createInteractionReplyOptions(this.renderResult))
  }
}

function getInteractiveComponents(
  result: RenderResult,
): Array<ButtonComponent | SelectMenuComponent> {
  return flattenRenderResult(result)
    .flatMap((component) => {
      return component.type === "actionRow" ? component.children : []
    })
    .filter((component): component is ButtonComponent | SelectMenuComponent => {
      return component.type === "button" || component.type === "selectMenu"
    })
}
