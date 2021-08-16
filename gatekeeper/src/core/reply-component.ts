import type {
  InteractionReplyOptions,
  MessageActionRowOptions,
  MessageSelectMenuOptions,
} from "discord.js"
import { isObject, isString, isTruthy } from "../internal/helpers.js"
import type { Falsy } from "../internal/types.js"
import type { ActionRowComponent } from "./components/action-row.js"
import type { EmbedComponent } from "./components/embed.js"

export type ReplyComponent = string | EmbedComponent | ActionRowComponent

export type RenderReplyFn = () => RenderResult

export type RenderResult =
  | ReplyComponent
  | number
  | boolean
  | undefined
  | null
  | RenderResult[]

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
