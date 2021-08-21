import type { ButtonComponent } from "./button"
import type { SelectMenuComponent } from "./select-menu"

export type ActionRowComponent = {
  type: "actionRow"
  children: ActionRowChild[]
}

export type ActionRowChild = SelectMenuComponent | ButtonComponent

export function actionRowComponent(
  ...children: Array<ActionRowChild | ActionRowChild[]>
): ActionRowComponent {
  return {
    type: "actionRow",
    children: children.flat(),
  }
}
