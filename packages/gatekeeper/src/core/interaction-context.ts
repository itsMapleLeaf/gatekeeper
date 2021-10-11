import type {
  Guild,
  GuildMember,
  Message,
  TextBasedChannels,
  User,
} from "discord.js"
import type { DiscordInteraction } from "../internal/types"
import type { CommandInstance } from "./command/command"
import type { RenderReplyFn } from "./component/reply-component"

/** Returned from {@link InteractionContext.reply}, for arbitrarily doing stuff with a reply message */
export type ReplyHandle = {
  /** The discord message associated with this reply */
  get message(): Message | undefined

  /**
   * Refresh the reply message.
   *
   * Gatekeeper will call this automatically on a component interaction,
   * but you can do so yourself when you want to update the message
   * outside of a component interaction
   */
  readonly refresh: () => void

  /** Delete the message. After this point,
   * {@link ReplyHandle.message message} will be undefined */
  readonly delete: () => void
}

/** Base type for all context objects */
export type InteractionContext = {
  /** The user that triggered this interaction.
   * For buttons, this is the user that clicked the button,
   * and so on */
  readonly user: User

  /** The channel that this interaction took place in. */
  readonly channel: TextBasedChannels | undefined

  /** The guild that this interaction took place in. */
  readonly guild: Guild | undefined

  /** The guild member for the user that triggered this interaction */
  readonly member: GuildMember | undefined

  /** Create a new reply for this interaction. This reply can be updated over time via interactions, or via manual {@link ReplyHandle.refresh refresh} calls */
  readonly reply: (render: RenderReplyFn) => ReplyHandle

  /** Like {@link InteractionContext.reply reply}, but only shows the message to the interacting user.
   *
   * This does not return a reply handle; ephemeral replies can't be updated or deleted manually
   */
  readonly ephemeralReply: (render: RenderReplyFn) => void

  /** [Defer](https://discordjs.guide/interactions/replying-to-slash-commands.html#deferred-responses) a reply, which shows a loading message. Useful if your command might take a long time to reply. */
  readonly defer: () => void

  /** Same as {@link InteractionContext.defer defer}, but shows the loading message only to the interacting user. */
  readonly ephemeralDefer: () => void
}

export function createInteractionContext({
  interaction,
  command,
}: {
  interaction: DiscordInteraction
  command: CommandInstance
}): InteractionContext {
  return {
    user: interaction.user,
    channel: interaction.channel ?? undefined,
    guild: interaction.guild ?? undefined,
    member: (interaction.member ?? undefined) as GuildMember | undefined,
    reply: (render: RenderReplyFn) => {
      const id = command.createReply(render, interaction)
      return {
        get message() {
          return command.getReplyMessage(id)
        },
        refresh: () => {
          command.refreshReply(id)
        },
        delete: () => {
          command.deleteReply(id)
        },
      }
    },
    ephemeralReply: (render: RenderReplyFn) => {
      command.createEphemeralReply(render, interaction)
    },
    defer: () => {
      command.defer(interaction)
    },
    ephemeralDefer: () => {
      command.ephemeralDefer(interaction)
    },
  }
}
