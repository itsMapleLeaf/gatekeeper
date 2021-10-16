import chalk from "chalk"
import type {
  ApplicationCommand,
  Interaction,
  MessageComponentInteraction,
} from "discord.js"
import { randomUUID } from "node:crypto"
import { ActionQueue } from "../../internal/action-queue"
import type { Logger } from "../../internal/logger"
import type {
  DiscordCommandManager,
  DiscordInteraction,
} from "../../internal/types"
import type { RenderReplyFn } from "../component/reply-component"
import type { ReplyInstance } from "../reply-instance"
import {
  callInteractionSubject,
  EphemeralReplyInstance,
  PublicReplyInstance,
} from "../reply-instance"

const commandSymbol = Symbol("command")

export type CommandConfig = {
  name: string
  matchesExisting: (appCommand: ApplicationCommand) => boolean
  register: (commandManager: DiscordCommandManager) => Promise<void>
  matchesInteraction: (interaction: Interaction) => boolean
  run: (
    interaction: DiscordInteraction,
    instance: CommandInstance,
  ) => void | Promise<unknown>
}

export type Command = CommandConfig & {
  [commandSymbol]: true
}

export function createCommand(config: CommandConfig): Command {
  return { ...config, [commandSymbol]: true }
}

export function isCommand(value: unknown): value is Command {
  return (value as Command)?.[commandSymbol] === true
}

const deferPriority = 0
const updatePriority = 1

export class CommandInstance {
  private readonly replyInstances = new Map<string, ReplyInstance>()
  private readonly logger: Logger
  private readonly command: Command

  private readonly queue = new ActionQueue({
    onError: (actionName, error) => {
      this.logger.error(
        `An error occurred running action`,
        chalk.bold(actionName),
        `in command`,
        chalk.bold(this.command.name),
      )
      this.logger.error(error)
    },
  })

  constructor(command: Command, logger: Logger) {
    this.command = command
    this.logger = logger
  }

  createReply(render: RenderReplyFn, interaction: DiscordInteraction) {
    const id = randomUUID()

    const instance = new PublicReplyInstance(render, {
      onDelete: () => this.replyInstances.delete(id),
    })

    this.replyInstances.set(id, instance)

    this.queue.addAction({
      name: "reply",
      run: () => instance.createMessage(interaction),
    })

    return id
  }

  getReplyMessage(id: string) {
    return this.replyInstances.get(id)?.getMessage()
  }

  refreshReply(id: string) {
    this.queue.addAction({
      name: "refresh",
      run: async () => this.replyInstances.get(id)?.refreshMessage(),
    })
  }

  deleteReply(id: string) {
    this.queue.addAction({
      name: "replyInstance.deleteMessage",
      run: async () => this.replyInstances.get(id)?.deleteMessage(),
    })
  }

  createEphemeralReply(render: RenderReplyFn, interaction: DiscordInteraction) {
    const id = randomUUID()
    const instance = new EphemeralReplyInstance(render)
    this.replyInstances.set(id, instance)

    this.queue.addAction({
      name: "replyInstance.createEphemeralMessage",
      run: () => instance.createMessage(interaction),
    })

    return id
  }

  async handleComponentInteraction(interaction: MessageComponentInteraction) {
    for (const [, instance] of this.replyInstances) {
      const subject = instance.findInteractionSubject(interaction)
      if (subject) {
        await callInteractionSubject(interaction, subject, this)

        this.queue.addAction({
          name: "replyInstance.handleComponentInteraction",
          priority: updatePriority,
          run: () =>
            instance.updateMessageFromComponentInteraction(
              interaction,
              subject,
              this,
            ),
        })

        return true
      }
    }
    return false
  }

  defer(interaction: DiscordInteraction) {
    this.queue.addAction({
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
    this.queue.addAction({
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
