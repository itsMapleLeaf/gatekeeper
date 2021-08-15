import {
  actionRowComponent,
  buttonComponent,
  defineSlashCommand,
} from "@itsmapleleaf/gatekeeper"

export const buttonCommand = defineSlashCommand({
  name: "button",
  description: "testing a button",
  async run(context) {
    let result = ""

    await context.createReply(() => {
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
