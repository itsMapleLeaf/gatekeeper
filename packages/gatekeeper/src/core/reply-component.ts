import type {
  InteractionReplyOptions,
  MessageActionRowOptions,
  MessageSelectMenuOptions,
} from "discord.js"
import { last } from "lodash"
import { isNonNil, isTruthy } from "../internal/helpers"
import type { Falsy } from "../internal/types"
import type { ActionRowComponent } from "./action-row"
import type { ButtonComponent } from "./button"
import type { EmbedComponent } from "./embed"
import type { SelectMenuComponent } from "./select-menu"

/**
 * A gatekeeper-specific type representing something that can be rendered in a discord message
 */
export type ReplyComponent = TextComponent | EmbedComponent | ActionRowComponent

/**
 * Represents the text in a message
 */
export type TextComponent = {
  type: "text"
  text: string
}

/**
 * The function passed to `context.reply`
 */
export type RenderReplyFn = () => RenderResult

/**
 * Anything that can be rendered in a reply.
 *   - Embed components, action row components, and text components are accepted as-is
 *   - Button and select menu components are automatically placed in action rows, respecting discord's restrictions
 *   - Strings and numbers become text components. Empty strings can be used to add empty lines in the message. `\n` will also add a new line.
 *   - Nested arrays are flattened
 *   - Everything else (booleans, `undefined`, `null`) is ignored
 */
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

/**
 * Flattens a {@link RenderResult} into a list of {@link ReplyComponent}s,
 * with buttons and selects automatically placed in action rows.
 */
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

/**
 * @internal
 */
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
