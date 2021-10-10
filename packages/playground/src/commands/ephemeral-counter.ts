import {
  buttonComponent,
  defineSlashCommand,
} from "@itsmapleleaf/gatekeeper/src/main"

export const ephemeralCounterCommand = defineSlashCommand({
  name: "ephemeral-counter",
  description: "a counter, but private",
  run(context) {
    let count = 0

    context.ephemeralReply(() => [
      buttonComponent({
        label: `increment (${count})`,
        style: "PRIMARY",
        onClick: () => {
          count++
        },
      }),
    ])
  },
})
