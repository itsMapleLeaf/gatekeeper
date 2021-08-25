import type { ButtonComponent } from "./button-component"
import type { SelectMenuComponent } from "./select-menu-component"

/**
 * Returned from {@link actionRowComponent}
 */
export type ActionRowComponent = {
  type: "actionRow"
  children: ActionRowChild[]
}

/**
 * A valid child of {@link actionRowComponent}
 */
export type ActionRowChild = SelectMenuComponent | ButtonComponent

/**
 * A component that represents a Discord [action row](https://discord.com/developers/docs/interactions/message-components#action-rows)
 * and follows the same limitations (max 5 buttons, max 1 select, can't mix both).
 *
 * You usually don't have to use this yourself;
 * Gatekeeper will automatically create action rows for you.
 * But if you have a specific structure in mind, you can still use this.
 *
 * ```js
 * context.reply(() => [
 *   // normally, these two buttons would be on the same line,
 *   // but you can use action row components to put them on different lines
 *   actionRowComponent(
 *     buttonComponent({
 *       // ...
 *     }),
 *   ),
 *   actionRowComponent(
 *     buttonComponent({
 *       // ...
 *     }),
 *   ),
 * ])
 * ```
 */
export function actionRowComponent(
  ...children: Array<ActionRowChild | ActionRowChild[]>
): ActionRowComponent {
  return {
    type: "actionRow",
    children: children.flat(),
  }
}
