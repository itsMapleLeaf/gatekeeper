// @ts-check
import {
  actionRowComponent,
  buttonComponent,
  defineSlashCommand,
  selectMenuComponent,
} from "../../../gatekeeper/src/main"

export const multiSelectCommand = defineSlashCommand({
  name: "multi-select",
  description: "multiple selections",
  run(context) {
    let selected = new Set<string>()
    let result = new Set<string>()

    context.reply(() => {
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
              { label: "orange", value: ":tangerine:", emoji: "🍊" },
              { label: "pear", value: ":pear:", emoji: "🍐" },
              { label: "peach", value: ":peach:", emoji: "🍑" },
            ],
            onSelect: (event) => {
              selected = new Set(event.values)
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
})
