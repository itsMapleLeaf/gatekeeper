import type {
  ApplicationCommand,
  ApplicationCommandManager,
  BaseCommandInteraction,
  GuildApplicationCommandManager,
  Interaction,
  MessageComponentInteraction,
} from "discord.js"
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
  private readonly replyInstances = new Set<ReplyInstance>()
  private readonly queue: ActionQueue

  constructor(queue: ActionQueue) {
    this.queue = queue
  }

  createReply(
    render: RenderReplyFn,
    interaction: BaseCommandInteraction | MessageComponentInteraction,
  ) {
    const instance = new ReplyInstance(render, {
      onDelete: (instance) => this.replyInstances.delete(instance),
    })

    this.replyInstances.add(instance)

    void this.queue.addAction({
      name: "replyInstance.createMessage",
      run: () => instance.createMessage(interaction),
    })

    return {
      refresh: () => {
        void this.queue.addAction({
          name: "replyInstance.refreshMessage",
          run: () => instance.refreshMessage(),
        })
      },
      delete: () => {
        void this.queue.addAction({
          name: "replyInstance.deleteMessage",
          run: () => instance.deleteMessage(),
        })
      },
    }
  }

  handleComponentInteraction(interaction: MessageComponentInteraction) {
    for (const instance of this.replyInstances) {
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
