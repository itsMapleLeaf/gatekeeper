import type { Message, MessageComponentInteraction } from "discord.js"
import type { DiscordInteraction } from "../internal/types"
import type { CommandInstance } from "./command/command"
import type { ButtonComponent } from "./component/button-component"
import type {
  RenderReplyFn,
  RenderResult,
  TopLevelComponent,
} from "./component/reply-component"
import {
  createInteractionReplyOptions,
  flattenRenderResult,
} from "./component/reply-component"
import type { SelectMenuComponent } from "./component/select-menu-component"
import { createInteractionContext } from "./interaction-context"

type ReplyInstanceEvents = {
  onDelete: (instance: ReplyInstance) => void
}

type InteractionSubject = ButtonComponent | SelectMenuComponent

export type ReplyInstance = {
  createMessage(interaction: DiscordInteraction): Promise<void>
  deleteMessage(): Promise<void>
  refreshMessage(): Promise<void>
  getMessage(): Message | undefined
  findInteractionSubject(
    interaction: MessageComponentInteraction,
  ): InteractionSubject | undefined
  handleComponentInteraction(
    interaction: MessageComponentInteraction,
    subject: InteractionSubject,
    commandInstance: CommandInstance,
  ): Promise<void>
}

export class PublicReplyInstance implements ReplyInstance {
  private readonly render: RenderReplyFn
  private renderResult: TopLevelComponent[] = []
  private message?: Message
  private readonly events: ReplyInstanceEvents

  constructor(render: RenderReplyFn, events: ReplyInstanceEvents) {
    this.render = render
    this.events = events
  }

  getMessage() {
    return this.message
  }

  async createMessage(interaction: DiscordInteraction) {
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
    command: CommandInstance,
  ) {
    const message = interaction.message as Message
    if (interaction.isButton() && subject.type === "button") {
      await subject.onClick({
        ...createInteractionContext({ interaction, command }),
        message,
      })
    }

    if (interaction.isSelectMenu() && subject.type === "selectMenu") {
      await subject.onSelect({
        ...createInteractionContext({ interaction, command }),
        message,
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

export class EphemeralReplyInstance implements ReplyInstance {
  private render: RenderReplyFn
  private renderResult: TopLevelComponent[] = []

  constructor(render: RenderReplyFn) {
    this.render = render
  }

  // eslint-disable-next-line class-methods-use-this
  getMessage() {
    return undefined
  }

  async createMessage(interaction: DiscordInteraction) {
    this.renderResult = flattenRenderResult(this.render())
    if (this.renderResult.length === 0) return

    const options = createInteractionReplyOptions(this.renderResult)

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ ...options, ephemeral: true })
      return
    }

    await interaction.reply({ ...options, ephemeral: true })
  }

  // eslint-disable-next-line class-methods-use-this
  async deleteMessage() {
    // do nothing
  }

  // eslint-disable-next-line class-methods-use-this
  async refreshMessage() {
    // do nothing
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
    command: CommandInstance,
  ) {
    const message = interaction.message as Message
    if (interaction.isButton() && subject?.type === "button") {
      await subject.onClick({
        ...createInteractionContext({ interaction, command }),
        message,
      })
    }

    if (interaction.isSelectMenu() && subject?.type === "selectMenu") {
      await subject.onSelect({
        ...createInteractionContext({ interaction, command }),
        message,
        values: interaction.values,
      })
    }

    this.renderResult = flattenRenderResult(this.render())
    if (this.renderResult.length === 0) return

    const options = createInteractionReplyOptions(this.renderResult)

    // need to call followup if deferred
    if (interaction.deferred) {
      await interaction.followUp(options)
      return
    }

    await interaction.update(options)
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
