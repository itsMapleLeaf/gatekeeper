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
import { randomUUID } from "node:crypto"
import { isObject, isString, isTruthy } from "../internal/helpers.js"
import type { Falsy } from "../internal/types.js"

export type ReplyComponent =
  | string
  | { type: "embed"; embed: MessageEmbedOptions | MessageEmbed }
  | { type: "actionRow"; children: ActionRowChild[] }

export type ReplyComponentOfType<T> = Extract<ReplyComponent, { type: T }>

export type ReplyComponentArgs = (string | ReplyComponent)[]

export type ActionRowChild = SelectMenuComponent | ButtonComponent

export type ButtonComponent = {
  type: "button"
  style: MessageButtonStyle
  label: string
  emoji?: EmojiResolvable
  onClick: () => void
}

export type SelectMenuComponent = {
  type: "selectMenu"
  options: MessageSelectOptionData[]
  selected?: string | string[] | undefined
  placeholder?: string | undefined
  minValues?: number | undefined
  maxValues?: number | undefined
  onSelect: (values: string[]) => void
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

export function selectMenuComponent({
  options,
  ...args
}: Omit<SelectMenuComponent, "type">): SelectMenuComponent {
  const selectedOptions = [args.selected].flat().filter(isString)

  return {
    ...args,
    type: "selectMenu",
    options: options.map((option) => ({
      ...option,
      default: option.default ?? selectedOptions.includes(option.value),
    })),
  }
}

export function processReplyComponents(components: ReplyComponent[]) {
  const messageComponentIds = new Map<ActionRowChild, string>()

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
            const customId = randomUUID()

            messageComponentIds.set(child, customId)

            if (child.type === "selectMenu") {
              return { ...child, type: "SELECT_MENU", customId }
            } else {
              return { ...child, type: "BUTTON", customId }
            }
          }
        ),
      }
    })
    .filter(isTruthy)

  const options: InteractionReplyOptions = {
    // workaround: can't send components by themselves
    content: content || "_ _",
    embeds,
    components: replyComponents,
  }

  return { replyOptions: options, messageComponentIds }
}
