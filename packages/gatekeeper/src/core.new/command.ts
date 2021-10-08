import { randomUUID } from "crypto"
import type {
  ApplicationCommand,
  ApplicationCommandManager,
  BaseCommandInteraction,
  GuildApplicationCommandManager,
  Interaction,
  MessageComponentInteraction,
} from "discord.js"
import { ActionQueue } from "../internal/action-queue"
import type { DiscordInteraction } from "../internal/types"
import type { RenderReplyFn } from "./reply-component"
import type { ReplyInstance } from "./reply-instance"
import { EphemeralReplyInstance, PublicReplyInstance } from "./reply-instance"

type DiscordCommandManager =
  | ApplicationCommandManager
  | GuildApplicationCommandManager

export type Command = {
  name: string
  matchesExisting: (appCommand: ApplicationCommand) => boolean
  register: (commandManager: DiscordCommandManager) => Promise<void>
  matchesInteraction: (interaction: Interaction) => boolean
  run: (
    interaction: BaseCommandInteraction | MessageComponentInteraction,
    instance: CommandInstance,
  ) => void | Promise<unknown>
}

const deferPriority = 0
const updatePriority = 1

export class CommandInstance {
  private readonly replyInstances = new Map<string, ReplyInstance>()
  private readonly queue = new ActionQueue()

  createReply(render: RenderReplyFn, interaction: DiscordInteraction) {
    const id = randomUUID()

    const instance = new PublicReplyInstance(render, {
      onDelete: () => this.replyInstances.delete(id),
    })

    this.replyInstances.set(id, instance)

    void this.queue.addAction({
      name: "replyInstance.createMessage",
      run: () => instance.createMessage(interaction),
    })

    return id
  }

  refreshReply(id: string) {
    void this.queue.addAction({
      name: "replyInstance.refreshMessage",
      run: async () => this.replyInstances.get(id)?.refreshMessage(),
    })
  }

  deleteReply(id: string) {
    void this.queue.addAction({
      name: "replyInstance.deleteMessage",
      run: async () => this.replyInstances.get(id)?.deleteMessage(),
    })
  }

  createEphemeralReply(render: RenderReplyFn, interaction: DiscordInteraction) {
    const id = randomUUID()
    const instance = new EphemeralReplyInstance(render)
    this.replyInstances.set(id, instance)

    void this.queue.addAction({
      name: "replyInstance.createEphemeralMessage",
      run: () => instance.createMessage(interaction),
    })

    return id
  }

  handleComponentInteraction(interaction: MessageComponentInteraction) {
    for (const [, instance] of this.replyInstances) {
      const subject = instance.findInteractionSubject(interaction)
      if (subject) {
        void this.queue.addAction({
          name: "replyInstance.handleComponentInteraction",
          priority: updatePriority,
          run: () =>
            instance.handleComponentInteraction(interaction, subject, this),
        })
        return true
      }
    }
    return false
  }

  defer(interaction: DiscordInteraction) {
    void this.queue.addAction({
      name: "defer",
      priority: deferPriority,
      run: async () => {
        if (interaction.deferred) return
        if (interaction.isMessageComponent()) return interaction.deferUpdate()
        return interaction.deferReply()
      },
    })
  }

  ephemeralDefer(interaction: DiscordInteraction) {
    void this.queue.addAction({
      name: "ephemeralDefer",
      priority: deferPriority,
      run: async () => {
        if (interaction.deferred) return
        if (interaction.isMessageComponent()) return interaction.deferUpdate()
        return interaction.deferReply({ ephemeral: true })
      },
    })
  }
}
