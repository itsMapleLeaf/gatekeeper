import {
  actionRowComponent,
  buttonComponent,
  defineSlashCommand,
} from "../../../gatekeeper/src/main"

export const ephemeralCounterCommand = defineSlashCommand({
  name: "ephemeral-counter",
  description: "a counter, but private",
  run(context) {
    let count = 0

    context.ephemeralReply(() => [
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