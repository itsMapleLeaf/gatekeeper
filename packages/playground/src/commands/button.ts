import { linkComponent } from "@itsmapleleaf/gatekeeper/src/core/link-component"
import {
  buttonComponent,
  defineSlashCommand,
} from "../../../gatekeeper/src/main"

export const buttonCommand = defineSlashCommand({
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
      linkComponent({
        label: "hi",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      }),
    ])
  },
})
