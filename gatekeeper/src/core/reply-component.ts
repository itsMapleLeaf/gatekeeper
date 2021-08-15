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

export type ActionRowChild = SelectMenuComponent | ButtonComponent

export type ButtonComponent = {
  type: "button"
  customId: string
  style: MessageButtonStyle
  label: string
  emoji?: EmojiResolvable
  onClick: () => void | Promise<unknown>
}

export type SelectMenuComponent = {
  type: "selectMenu"
  customId: string
  options: MessageSelectOptionData[]
  selected?: string | string[] | undefined
  placeholder?: string | undefined
  minValues?: number | undefined
  maxValues?: number | undefined
  onSelect: (values: string[]) => void | Promise<unknown>
}

export function embedComponent(
  embed: MessageEmbedOptions | MessageEmbed,
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
  options: Omit<ButtonComponent, "type" | "customId">,
): ButtonComponent {
  return {
    ...options,
    type: "button",
    customId: randomUUID(),
  }
}

type SelectMenuComponentArgs = Omit<
  SelectMenuComponent,
  "type" | "customId" | "selected"
> & {
  selected: Iterable<string> | string
}

export function selectMenuComponent({
  options,
  selected,
  ...args
}: SelectMenuComponentArgs): SelectMenuComponent {
  const selectedOptions =
    typeof selected === "string" ? [selected] : [...selected]

  return {
    ...args,
    type: "selectMenu",
    customId: randomUUID(),
    options: options.map((option) => ({
      ...option,
      default: option.default ?? selectedOptions.includes(option.value),
    })),
  }
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
