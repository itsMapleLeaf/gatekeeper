import {
  actionRowComponent,
  buttonComponent,
  defineSlashCommand,
} from "../../../gatekeeper/src/main"

export const ephemeralCounterCommand = defineSlashCommand({
  name: "ephemeral-counter",
  description: "a counter, but private",
  async run(context) {
    let count = 0

    await context.createEphemeralReply(() => [
      actionRowComponent(
        buttonComponent({
          label: `increment (${count})`,
          style: "PRIMARY",
          onClick: () => {
            count++
          },
        }),
      ),
    ])
  },
})
