// @ts-check
import {
  actionRowComponent,
  buttonComponent,
  defineSlashCommand,
  selectMenuComponent,
} from "@itsmapleleaf/gatekeeper"

export const selectCommand = defineSlashCommand({
  name: "select",
  description: "testing a select",
  async run(context) {
    let selected: string | undefined
    let result: string | undefined

    await context.createReply(() => {
      if (result) {
        return [`yeah, i'm a ${result}`]
      }

      return [
        actionRowComponent(
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
            onSelect: (event) => {
              selected = event.values[0]
            },
          }),
        ),
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
