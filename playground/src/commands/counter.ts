import {
  actionRowComponent,
  buttonComponent,
  defineSlashCommand,
} from "@itsmapleleaf/gatekeeper"

export const counterCommand = defineSlashCommand({
  name: "counter",
  description: "make a counter",
  async run(context) {
    let count = 0

    const reply = await context.createReply(() => [
      `button pressed ${count} times`,
      actionRowComponent(
        buttonComponent({
          style: "PRIMARY",
          label: "press it",
          onClick: () => {
            count += 1
          },
        }),
        buttonComponent({
          style: "PRIMARY",
          label: "done",
          onClick: async (event) => {
            if (event.user.id === context.user.id) {
              await reply.delete()
            }
          },
        }),
      ),
    ])
  },
})
