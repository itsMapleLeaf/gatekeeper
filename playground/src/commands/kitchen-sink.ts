import {
  actionRowComponent,
  buttonComponent,
  defineSlashCommand,
} from "../../../gatekeeper/src/main"

export const kitchenSinkCommand = defineSlashCommand({
  name: "kitchen-sink",
  description: "stress testing",
  run(context) {
    const replies: { refresh: () => void }[] = []

    let count = 0

    function increment() {
      count++
      replies.forEach((reply) => reply.refresh())
    }

    const counterComponent = () => [
      `count: ${count}`,
      actionRowComponent(
        buttonComponent({
          label: "click me",
          style: "PRIMARY",
          onClick: (buttonContext) => {
            increment()
            buttonContext.ephemeralReply(() => "cool, you clicked the button!")
          },
        }),
      ),
    ]

    replies.push(context.reply(counterComponent))
    context.ephemeralReply(counterComponent)
  },
})
