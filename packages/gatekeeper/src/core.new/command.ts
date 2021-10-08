import type {
  ApplicationCommand,
  ApplicationCommandManager,
  BaseCommandInteraction,
  GuildApplicationCommandManager,
  Interaction,
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
  private readonly queue = new ActionQueue()
  private readonly replyInstances = new Set<ReplyInstance>()

  constructor(command: Command, interaction: BaseCommandInteraction) {
    this.command = command
    this.interaction = interaction
  }

  async run() {
    const context: InteractionContext = {
      reply: (render) => {
        const instance = new ReplyInstance(render)
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
    }

    await this.command.run(context)
  }
}
