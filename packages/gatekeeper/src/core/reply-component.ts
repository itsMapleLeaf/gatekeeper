import type {
  InteractionReplyOptions,
  MessageActionRowOptions,
  MessageComponentOptions,
} from "discord.js"
import { last } from "lodash"
import { isNonNil, isTruthy } from "../internal/helpers"
import type { Falsy } from "../internal/types"
import type { ActionRowComponent } from "./action-row-component"
import type { ButtonComponent } from "./button-component"
import type { EmbedComponent } from "./embed"
import type { LinkComponent } from "./link-component"
import type { SelectMenuComponent } from "./select-menu-component"

/**
 * Any reply component object
 */
export type ReplyComponent =
  | TextComponent
  | EmbedComponent
  | ActionRowComponent
  | ButtonComponent
  | SelectMenuComponent
  | LinkComponent

/**
 * A gatekeeper-specific type representing top-level components,
 * stuff that doesn't need an extra wrapper.
 *
 * For example, a button isn't top level,
 * as it needs to be wrapped in an action row
 */
export type TopLevelComponent =
  | TextComponent
  | EmbedComponent
  | ActionRowComponent

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
  | string
  | number
  | boolean
  | undefined
  | null
  | RenderResult[]

function collectReplyComponents(items: RenderResult[]) {
  const components: ReplyComponent[] = []

  for (const child of items) {
    if (typeof child === "boolean" || child == null) continue

    if (typeof child === "string" || typeof child === "number") {
      components.push({ type: "text", text: String(child) })
      continue
    }

    if (Array.isArray(child)) {
      components.push(...collectReplyComponents(child))
      continue
    }

    components.push(child)
  }

  return components
}

/**
 * Flattens a {@link RenderResult} into a list of {@link TopLevelComponent}s,
 * with message components automatically placed in action rows.
 */
export function flattenRenderResult(result: RenderResult): TopLevelComponent[] {
  const ungroupedComponents = collectReplyComponents([result].flat())

  const components: TopLevelComponent[] = []

  for (const component of ungroupedComponents) {
    const lastComponent = last(components)

    if (component.type === "button" || component.type === "link") {
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
  components: TopLevelComponent[],
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
        components: component.children.map<MessageComponentOptions>((child) => {
          switch (child.type) {
            case "selectMenu":
              return { ...child, type: "SELECT_MENU" }
            case "button":
              return { ...child, type: "BUTTON" }
            case "link":
              return { ...child, style: "LINK", type: "BUTTON" }
          }
        }),
      }
    })
    .filter(isTruthy)

  const options: InteractionReplyOptions = {
    content,
    embeds,
    components: replyComponents,
  }

  // content can't be an empty string... at all
  if (options.content === "") {
    delete options.content
  }

  // workaround: you can't send just components without any other content
  const hasComponents = options.components?.length
  const hasContent = options.content || options.embeds?.length
  if (hasComponents && !hasContent) {
    options.content = "_ _"
  }

  return options
}
