import type {
  CommandInteraction,
  GuildMember,
  InteractionReplyOptions,
  Message,
  MessageComponentInteraction,
} from "discord.js"
import type {
  BaseEvent,
  RenderReplyFn,
  ReplyComponent,
} from "./reply-component"
import {
  createInteractionReplyOptions,
  flattenRenderResult,
  getInteractiveComponents,
} from "./reply-component"

export abstract class ReplyInstance {
  protected readonly render: RenderReplyFn
  protected components: ReplyComponent[]
  protected active = true

  protected constructor(render: RenderReplyFn, components: ReplyComponent[]) {
    this.render = render
    this.components = components
  }

  abstract update(): Promise<void>
  abstract cleanup(): Promise<void>

  async handleMessageComponentInteraction(
    interaction: MessageComponentInteraction,
  ) {
    if (!this.active) return

    const component = getInteractiveComponents(this.components).find(
      (component) => component.customId === interaction.customId,
    )
    if (!component) return

    const event: BaseEvent = {
      user: interaction.user,
      channel: interaction.channel ?? undefined,
      member: (interaction.member as GuildMember | null) ?? undefined,
      guild: interaction.guild ?? undefined,
    }

    if (interaction.isSelectMenu() && component.type === "selectMenu") {
      await component.onSelect({ ...event, values: interaction.values })
    }

    if (interaction.isButton() && component.type === "button") {
      await component.onClick(event)
    }

    await this.update()
  }
}

export class PublicReplyInstance extends ReplyInstance {
  private message: Message

  private constructor(
    render: RenderReplyFn,
    components: ReplyComponent[],
    message: Message,
  ) {
    super(render, components)
    this.message = message
  }

  static async create(
    commandInteraction: CommandInteraction,
    render: RenderReplyFn,
  ): Promise<ReplyInstance | undefined> {
    const components = flattenRenderResult(render())
    if (!components.length) return

    const replyOptions = createInteractionReplyOptions(components)

    const message = commandInteraction.replied
      ? await commandInteraction.followUp(replyOptions)
      : commandInteraction.deferred
      ? await commandInteraction.editReply(replyOptions)
      : await commandInteraction.reply({ ...replyOptions, fetchReply: true })

    return new this(render, components, message as Message)
  }

  async update() {
    if (!this.active) return

    this.components = flattenRenderResult(this.render())
    if (this.components.length === 0) return this.cleanup()

    const replyOptions = createInteractionReplyOptions(this.components)
    this.message = await this.message.edit(replyOptions)
  }

  async cleanup() {
    if (!this.active) return

    this.active = false
    await this.message.delete()
  }
}

export class EphemeralReplyInstance extends ReplyInstance {
  private interaction: CommandInteraction | MessageComponentInteraction

  private constructor(
    render: RenderReplyFn,
    components: ReplyComponent[],
    interaction: CommandInteraction | MessageComponentInteraction,
  ) {
    super(render, components)
    this.interaction = interaction
  }

  static async create(
    commandInteraction: CommandInteraction,
    render: RenderReplyFn,
  ): Promise<ReplyInstance | undefined> {
    const components = flattenRenderResult(render())
    if (!components.length) return

    const replyOptions: InteractionReplyOptions = {
      ...createInteractionReplyOptions(components),
      ephemeral: true,
    }

    if (commandInteraction.replied) {
      // followups can't be updated(?), so we won't make an instance for it
      await commandInteraction.followUp(replyOptions)
      return
    }

    await commandInteraction.reply(replyOptions)
    return new this(render, components, commandInteraction)
  }

  async update() {
    if (!this.active) return

    this.components = flattenRenderResult(this.render())
    if (this.components.length === 0) return this.cleanup()

    const replyOptions = createInteractionReplyOptions(this.components)
    await this.interaction.editReply(replyOptions)
  }

  cleanup() {
    this.active = false
    return Promise.resolve()
  }
}
