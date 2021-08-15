import { actionRowComponent, buttonComponent } from "@itsmapleleaf/gatekeeper"

/** @type {import("@itsmapleleaf/gatekeeper").CommandHandler} */
export const ephemeralCounterCommand = {
  name: "ephemeral-counter",
  description: "a counter, but private",
  async run(context) {
    let count = 0

    await context.createEphemeralReply(() => {
      return [
        actionRowComponent(
          buttonComponent({
            label: `increment (${count})`,
            style: "PRIMARY",
            onClick: () => {
              count++
            },
          }),
        ),
      ]
    })
  },
}
