import type {
  ApplicationCommand,
  ApplicationCommandManager,
  BaseCommandInteraction,
  GuildApplicationCommandManager,
  Interaction,
  MessageComponentInteraction,
} from "discord.js"
import { ActionQueue } from "./action-queue"
import type { InteractionContext } from "./interaction-context"
import { ReplyInstance } from "./reply-instance"

type DiscordCommandManager =
  | ApplicationCommandManager
  | GuildApplicationCommandManager

export type Command = {
  name: string
  matchesExisting: (appCommand: ApplicationCommand) => boolean
  register: (commandManager: DiscordCommandManager) => Promise<void>
  matchesInteraction: (interaction: Interaction) => boolean
  run: (context: InteractionContext) => void | Promise<unknown>
}

export class CommandInstance {
  private readonly command: Command
  private readonly interaction: BaseCommandInteraction
  private readonly replyInstances = new Set<ReplyInstance>()
  private readonly queue = new ActionQueue()

  constructor(command: Command, interaction: BaseCommandInteraction) {
    this.command = command
    this.interaction = interaction
  }

  async run() {
    await this.command.run({
      reply: (render) => {
        const instance = new ReplyInstance(render, {
          onDelete: (instance) => this.replyInstances.delete(instance),
        })

        this.replyInstances.add(instance)

        void this.queue.addAction({
          name: "replyInstance.createMessage",
          run: () => instance.createMessage(this.interaction),
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
      },
    })
  }

  handleComponentInteraction(interaction: MessageComponentInteraction) {
    for (const instance of this.replyInstances) {
      const subject = instance.findInteractionSubject(interaction)
      if (subject) {
        void this.queue.addAction({
          name: "replyInstance.handleComponentInteraction",
          run: () => instance.handleComponentInteraction(interaction, subject),
        })
        return true
      }
    }
    return false
  }
}
