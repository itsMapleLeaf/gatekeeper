import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { buttonComponent } from "@itsmapleleaf/gatekeeper"

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
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
}
