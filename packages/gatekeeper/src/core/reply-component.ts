import type {
  Guild,
  GuildMember,
  InteractionReplyOptions,
  MessageActionRowOptions,
  MessageSelectMenuOptions,
  TextBasedChannels,
  User,
} from "discord.js"
import { last } from "lodash"
import { isNonNil, isTruthy } from "../internal/helpers"
import type { Falsy } from "../internal/types"
import type {
  ActionRowChild,
  ActionRowComponent,
} from "./components/action-row"
import type { ButtonComponent } from "./components/button"
import type { EmbedComponent } from "./components/embed"
import type { SelectMenuComponent } from "./components/select-menu"

export type ReplyComponent = TextComponent | EmbedComponent | ActionRowComponent

export type TextComponent = {
  type: "text"
  text: string
}

export type RenderReplyFn = () => RenderResult

export type RenderResult =
  | ReplyComponent
  | ButtonComponent
  | SelectMenuComponent
  | string
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

function collectFlatReplyComponents(items: RenderResult[]) {
  const components: (ReplyComponent | ButtonComponent | SelectMenuComponent)[] =
    []

  for (const child of items) {
    if (typeof child === "boolean" || child == null) continue

    if (typeof child === "string" || typeof child === "number") {
      components.push({ type: "text", text: String(child) })
      continue
    }

    if (Array.isArray(child)) {
      components.push(...collectFlatReplyComponents(child))
      continue
    }

    components.push(child)
  }

  return components
}

export function flattenRenderResult(result: RenderResult): ReplyComponent[] {
  const ungroupedComponents = collectFlatReplyComponents([result].flat())

  const components: ReplyComponent[] = []

  for (const component of ungroupedComponents) {
    const lastComponent = last(components)

    if (component.type === "button") {
      if (
        lastComponent?.type === "actionRow" &&
        lastComponent.children.every((child) => child.type !== "selectMenu") &&
        lastComponent.children.length < 5
      ) {
        lastComponent.children.push(component)
        continue
      }

      components.push({
        type: "actionRow",
        children: [component],
      })
      continue
    }

    if (component.type === "selectMenu") {
      if (
        lastComponent?.type === "actionRow" &&
        lastComponent.children.length === 0
      ) {
        lastComponent.children.push(component)
        continue
      }

      components.push({
        type: "actionRow",
        children: [component],
      })
      continue
    }

    components.push(component)
  }

  return components.filter((component) => {
    const isEmptyActionRow =
      component.type === "actionRow" && component.children.length === 0
    return !isEmptyActionRow
  })
}

export function getInteractiveComponents(
  result: RenderResult,
): ActionRowChild[] {
  return flattenRenderResult(result).flatMap((actionRow) =>
    actionRow.type === "actionRow" ? actionRow.children : [],
  )
}

export function createInteractionReplyOptions(
  components: ReplyComponent[],
): InteractionReplyOptions {
  const content = components
    .map((component) =>
      component.type === "text" ? component.text : undefined,
    )
    .filter(isNonNil)
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
    // workaround: can't send components by themselves without content
    content: content || "_ _",
    embeds,
    components: replyComponents,
  }
}
