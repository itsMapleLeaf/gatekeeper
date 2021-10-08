import { randomUUID } from "crypto"
import type {
  ApplicationCommand,
  ApplicationCommandManager,
  BaseCommandInteraction,
  GuildApplicationCommandManager,
  Interaction,
  MessageComponentInteraction,
} from "discord.js"
import type { DiscordInteraction } from "../internal/types"
import type { ActionQueue } from "./action-queue"
import type { RenderReplyFn } from "./reply-component"
import { ReplyInstance } from "./reply-instance"

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

export class CommandInstance {
  private readonly replyInstances = new Map<string, ReplyInstance>()
  private readonly queue: ActionQueue

  constructor(queue: ActionQueue) {
    this.queue = queue
  }

  createReply(render: RenderReplyFn, interaction: DiscordInteraction) {
    const id = randomUUID()

    const instance = new ReplyInstance(render, {
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
      run: () => {
        return this.replyInstances.get(id)?.refreshMessage()
      },
    })
  }

  deleteReply(id: string) {
    void this.queue.addAction({
      name: "replyInstance.deleteMessage",
      run: () => this.replyInstances.get(id)?.deleteMessage(),
    })
  }

  handleComponentInteraction(interaction: MessageComponentInteraction) {
    for (const [, instance] of this.replyInstances) {
      const subject = instance.findInteractionSubject(interaction)
      if (subject) {
        void this.queue.addAction({
          name: "replyInstance.handleComponentInteraction",
          run: () =>
            instance.handleComponentInteraction(interaction, subject, this),
        })
        return true
      }
    }
    return false
  }
}
