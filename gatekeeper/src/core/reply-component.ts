import type {
  EmojiResolvable,
  InteractionReplyOptions,
  MessageActionRowOptions,
  MessageButtonStyle,
  MessageEmbed,
  MessageEmbedOptions,
  MessageSelectMenuOptions,
  MessageSelectOptionData,
} from "discord.js"
import { isObject, isString, isTruthy } from "../internal/helpers.js"
import type { Falsy } from "../internal/types.js"

export type ReplyComponent =
  | string
  | { type: "embed"; embed: MessageEmbedOptions | MessageEmbed }
  | { type: "actionRow"; children: ActionRowChild[] }

export type ReplyComponentArgs = (string | ReplyComponent)[]

export type ActionRowChild = SelectMenuComponent | ButtonComponent

type ButtonComponent = {
  type: "button"
  customId: string
  style: MessageButtonStyle
  label?: string
  emoji?: EmojiResolvable
}

type SelectMenuComponent = {
  type: "selectMenu"
  customId: string
  options: MessageSelectOptionData[]
}

export function embedComponent(
  embed: MessageEmbedOptions | MessageEmbed
): ReplyComponent {
  return { type: "embed", embed }
}

export function actionRowComponent(
  ...children: (ActionRowChild | ActionRowChild[])[]
): ReplyComponent {
  return {
    type: "actionRow",
    children: children.flat(),
  }
}

export function buttonComponent(
  options: Omit<ButtonComponent, "type">
): ButtonComponent {
  return { type: "button", ...options }
}

export function selectMenuComponent(options: {
  customId: string
  options: MessageSelectOptionData[]
}): SelectMenuComponent {
  return { type: "selectMenu", ...options }
}

export function createReplyOptions(
  components: ReplyComponent[]
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
          }
        ),
      }
    })
    .filter(isTruthy)

  return { content, embeds, components: replyComponents }
}
