import {
  actionRowComponent,
  buttonComponent,
  defineSlashCommand,
} from "../../../gatekeeper/src/main"

export const kitchenSinkCommand = defineSlashCommand({
  name: "kitchen-sink",
  description: "stress testing",
  async run(context) {
    let count = 0

    const counterComponent = () => [
      `count: ${count}`,
      actionRowComponent(
        buttonComponent({
          label: "click me",
          style: "PRIMARY",
          onClick: async (buttonContext) => {
            count++
            await buttonContext.ephemeralReply(
              () => "cool, you clicked the button!",
            )
          },
        }),
      ),
    ]

    await context.reply(counterComponent)
    await context.ephemeralReply(counterComponent)
  },
})
