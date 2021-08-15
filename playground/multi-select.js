// @ts-check
import {
  actionRowComponent,
  buttonComponent,
  selectMenuComponent,
} from "@itsmapleleaf/gatekeeper"

/** @type {import("@itsmapleleaf/gatekeeper").CommandHandler} */
export const multiSelectCommand = {
  name: "multi-select",
  description: "multiple selections",
  async run(context) {
    let selected = new Set()
    let result = new Set()

    await context.createReply(() => {
      if (result.size) {
        return [`you picked: ${[...result].join(", ")}`]
      }

      return [
        actionRowComponent(
          selectMenuComponent({
            placeholder: "pick your favorite fruits",
            minValues: 1,
            maxValues: 6,
            selected,
            options: [
              { label: "strawberry", value: ":strawberry:", emoji: "🍓" },
              { label: "banana", value: ":banana:", emoji: "🍌" },
              { label: "apple", value: ":apple:", emoji: "🍎" },
              { label: "orange", value: ":orange:", emoji: "🍊" },
              { label: "pear", value: ":pear:", emoji: "🍐" },
              { label: "peach", value: ":peach:", emoji: "🍑" },
            ],
            onSelect: (values) => {
              selected = new Set(values)
            },
          }),
        ),
        selected.size > 0 &&
          actionRowComponent(
            buttonComponent({
              style: "SECONDARY",
              label: "done",
              onClick: () => {
                result = selected
              },
            }),
          ),
      ]
    })
  },
}
