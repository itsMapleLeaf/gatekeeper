import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { buttonComponent, selectMenuComponent } from "@itsmapleleaf/gatekeeper"

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "select",
    description: "testing a select",
    run(context) {
      let selected: string | undefined
      let result: string | undefined

      context.reply(() => {
        if (result) {
          return `yeah, i'm a ${result}`
        }

        return [
          selectMenuComponent({
            selected: selected || undefined,
            options: [
              {
                label: "die",
                value: ":game_die:",
                emoji: "🎲",
              },
              {
                label: "strawberry",
                value: ":strawberry:",
                emoji: "🍓",
              },
              {
                label: "bird",
                value: "<:hmph:672311909290344478>",
                emoji: "672311909290344478",
              },
            ],
            onSelect: (selectContext) => (selected = selectContext.values[0]),
          }),
          buttonComponent({
            style: "SECONDARY",
            label: "done",
            onClick: () => {
              result = selected
            },
          }),
        ]
      })
    },
  })
}
