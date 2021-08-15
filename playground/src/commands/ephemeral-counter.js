import {
  actionRowComponent,
  buttonComponent,
  defineSlashCommand,
} from "@itsmapleleaf/gatekeeper"

export const ephemeralCounterCommand = defineSlashCommand({
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
})
