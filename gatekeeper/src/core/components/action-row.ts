import type { ButtonComponent } from "./button"
import type { SelectMenuComponent } from "./select-menu"

export type ActionRowComponent<State> = {
  type: "actionRow"
  children: ActionRowChild<State>[]
}

export type ActionRowChild<State> =
  | SelectMenuComponent<State>
  | ButtonComponent<State>

export function actionRowComponent<State>(
  ...children: Array<ActionRowChild<State> | ActionRowChild<State>[]>
): ActionRowComponent<State> {
  return {
    type: "actionRow",
    children: children.flat(),
  }
}
