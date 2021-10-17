import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { buttonComponent, embedComponent } from "@itsmapleleaf/gatekeeper"

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "counter",
    description: "make a counter",
    run(context) {
      let count = 0

      const reply = context.reply(() => [
        embedComponent({
          title: "Counter",
          description: `button pressed ${count} times`,
        }),
        buttonComponent({
          style: "PRIMARY",
          label: `press it`,
          onClick: () => (count += 1),
        }),
        buttonComponent({
          style: "PRIMARY",
          label: "done",
          onClick: (event) => {
            if (event.user.id === context.user.id) {
              reply.delete()
            }
          },
        }),
      ])
    },
  })
}
