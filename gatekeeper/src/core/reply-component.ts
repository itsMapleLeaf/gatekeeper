import type {
  Guild,
  GuildMember,
  InteractionReplyOptions,
  MessageActionRowOptions,
  MessageSelectMenuOptions,
  TextBasedChannels,
  User,
} from "discord.js"
import { isObject, isString, isTruthy } from "../internal/helpers"
import type { Falsy } from "../internal/types"
import type {
  ActionRowChild,
  ActionRowComponent,
} from "./components/action-row"
import type { EmbedComponent } from "./components/embed"

export type ReplyComponent<State> =
  | TextComponent
  | EmbedComponent
  | ActionRowComponent<State>

export type TextComponent = {
  type: "text"
  text: string
}

export type RenderReplyFn<State> = (state: State) => RenderResult<State>

export type RenderResult<State> =
  | ReplyComponent<State>
  | string
  | number
  | boolean
  | undefined
  | null
  | RenderResult<State>[]

export type BaseEvent = {
  channel: TextBasedChannels | undefined
  member: GuildMember | undefined
  user: User
  guild: Guild | undefined
}

export function flattenRenderResult<State>(
  result: RenderResult<State>,
): ReplyComponent<State>[] {
  if (Array.isArray(result)) return result.flatMap(flattenRenderResult)
  if (isObject(result)) return [result]
  if (isString(result)) return [{ type: "text", text: result }]
  if (typeof result === "number")
    return [{ type: "text", text: String(result) }]
  return []
}

export function getInteractiveComponents<State>(
  result: RenderResult<State>,
): ActionRowChild<State>[] {
  return flattenRenderResult(result).flatMap((actionRow) =>
    actionRow.type === "actionRow" ? actionRow.children : [],
  )
}

export function createInteractionReplyOptions<State>(
  components: ReplyComponent<State>[],
): InteractionReplyOptions {
  const content = components
    .map((component) => component.type === "text" && component.text)
    .filter(isTruthy)
    .join("\n")

  const embeds = components
    .map((component) => component.type === "embed" && component.embed)
    .filter(isTruthy)

  const replyComponents: MessageActionRowOptions[] = components
    .map<MessageActionRowOptions | Falsy>((component) => {
      if (component.type !== "actionRow") return
      return {
        type: "ACTION_ROW",
        components: component.children.map<MessageSelectMenuOptions>(
          (child) => {
            if (child.type === "selectMenu") {
              return { ...child, type: "SELECT_MENU" }
            } else {
              return { ...child, type: "BUTTON" }
            }
          },
        ),
      }
    })
    .filter(isTruthy)

  return {
    // workaround: can't send components by themselves
    content: content || "_ _",
    embeds,
    components: replyComponents,
  }
}
