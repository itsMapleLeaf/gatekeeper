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
import type { ActionRowComponent } from "./components/action-row"
import type { EmbedComponent } from "./components/embed"

export type ReplyComponent = string | EmbedComponent | ActionRowComponent

export type RenderReplyFn = () => RenderResult

export type RenderResult =
  | ReplyComponent
  | number
  | boolean
  | undefined
  | null
  | RenderResult[]

export type BaseEvent = {
  channel: TextBasedChannels | undefined
  member: GuildMember | undefined
  user: User
  guild: Guild | undefined
}

export function flattenRenderResult(result: RenderResult): ReplyComponent[] {
  if (Array.isArray(result)) return result.flatMap(flattenRenderResult)
  if (isObject(result) || isString(result)) return [result]
  if (typeof result === "number") return [String(result)]
  return []
}

export function getInteractiveComponents(result: RenderResult) {
  return flattenRenderResult(result)
    .filter(isObject)
    .flatMap((actionRow) =>
      actionRow.type === "actionRow" ? actionRow.children : [],
    )
}

export function createInteractionReplyOptions(
  components: ReplyComponent[],
): InteractionReplyOptions {
  const content = components.filter(isString).join("\n")

  const embeds = components
    .filter(isObject)
    .map((component) => component.type === "embed" && component.embed)
    .filter(isTruthy)

  const replyComponents: MessageActionRowOptions[] = components
    .filter(isObject)
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
