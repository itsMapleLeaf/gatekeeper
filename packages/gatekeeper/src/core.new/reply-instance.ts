import type { BaseCommandInteraction, Message } from "discord.js"
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

export class ReplyInstance {
  private render: RenderReplyFn
  private renderResult: TopLevelComponent[] = []
  private message?: Message

  constructor(render: RenderReplyFn) {
    this.render = render
  }

  async createMessage(interaction: BaseCommandInteraction) {
    this.renderResult = flattenRenderResult(this.render())
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
    if (!this.message) return

    const promise = this.message.delete()
    this.message = undefined
    return promise
  }

  async refreshMessage() {
    this.renderResult = flattenRenderResult(this.render())
    await this.message?.edit(createInteractionReplyOptions(this.renderResult))
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
