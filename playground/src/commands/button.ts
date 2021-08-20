import {
  actionRowComponent,
  buttonComponent,
  defineSlashCommand,
} from "../../../gatekeeper/src/main"

export const buttonCommand = defineSlashCommand({
  name: "button",
  description: "testing a button",
  run(context) {
    let result = ""

    context.reply(() => {
      if (result) {
        return [result]
      }

      return [
        "button",
        actionRowComponent(
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
        ),
      ]
    })
  },
})
