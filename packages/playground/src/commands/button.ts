import type { Gatekeeper } from "@itsmapleleaf/gatekeeper/src/main"
import {
  buttonComponent,
  linkComponent,
} from "@itsmapleleaf/gatekeeper/src/main"

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "buttons",
    description: "testing buttons and links",
    run(context) {
      let result = ""

      context.reply(() => [
        result,
        buttonComponent({
          style: "PRIMARY",
          label: "first",
          onClick: () => {
            result = "you clicked the first"
          },
        }),
        buttonComponent({
          style: "SECONDARY",
          label: "second",
          onClick: () => {
            result = "you clicked the second"
          },
        }),
        buttonComponent({
          style: "SECONDARY",
          label: "can't click this lol",
          disabled: true,
          onClick: () => {},
        }),
        linkComponent({
          label: "hi",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        }),
      ])
    },
  })
}
