// @ts-check
import {
  actionRowComponent,
  buttonComponent,
  selectMenuComponent,
} from "@itsmapleleaf/gatekeeper"

/** @type {import("@itsmapleleaf/gatekeeper").CommandHandler} */
export const selectCommand = {
  name: "select",
  description: "testing a select",
  async run(context) {
    const reply = await context.defer()

    /** @type {string | undefined} */
    let selected
    let running = true

    while (running) {
      await reply.edit(
        actionRowComponent(
          selectMenuComponent({
            selected,
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
            onSelect: ([value]) => {
              selected = value
            },
          })
        ),
        actionRowComponent(
          buttonComponent({
            style: "SECONDARY",
            label: "done",
            onClick: () => {
              running = false
            },
          })
        )
      )
    }

    await reply.edit(`yeah, i'm a ${selected}`)
  },
}
