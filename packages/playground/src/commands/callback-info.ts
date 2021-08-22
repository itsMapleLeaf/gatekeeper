import {
  buttonComponent,
  defineSlashCommand,
} from "../../../gatekeeper/src/main"

export const callbackInfoCommand = defineSlashCommand({
  name: "callback-info",
  description: "test component callback info",
  run(context) {
    const clickCounts = new Map<string, number>()

    context.reply(() => {
      const content = [...clickCounts]
        .map(([userId, count]) => `<@!${userId}> clicked ${count} times`)
        .join("\n")

      return [
        content,
        buttonComponent({
          label: "click it you won't",
          style: "SUCCESS",
          onClick: (event) => {
            const count = clickCounts.get(event.user.id) ?? 0
            clickCounts.set(event.user.id, count + 1)
          },
        }),
      ]
    })
  },
})
