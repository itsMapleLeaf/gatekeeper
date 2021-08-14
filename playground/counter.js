import { actionRowComponent, buttonComponent } from "@itsmapleleaf/gatekeeper"

/** @type {import("@itsmapleleaf/gatekeeper").CommandHandler} */
export const counterCommand = {
  name: "counter",
  description: "make a counter",
  async run(context) {
    const reply = await context.defer()

    let count = 0
    let running = true

    do {
      await reply.edit(
        `button pressed ${count} times`,
        actionRowComponent(
          buttonComponent({
            style: "PRIMARY",
            label: "press it",
            onClick: () => {
              count += 1
            },
          }),
          buttonComponent({
            style: "PRIMARY",
            label: "i'm bored",
            onClick: () => {
              running = false
            },
          })
        )
      )
    } while (running)

    await reply.edit("well fine then")
  },
}
