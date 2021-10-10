import {
  buttonComponent,
  Gatekeeper,
} from "@itsmapleleaf/gatekeeper/src/main"

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
  });
}
