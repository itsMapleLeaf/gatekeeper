import { defineSlashCommand } from "@itsmapleleaf/gatekeeper"
import {
  actionRowComponent,
  buttonComponent,
} from "@itsmapleleaf/gatekeeper/src/main"

export const callbackInfoCommand = defineSlashCommand({
  name: "callback-info",
  description: "test component callback info",
  async run(context) {
    const clickCounts = new Map<string, number>()

    return context.createReply(() => {
      const content = [...clickCounts]
        .map(([userId, count]) => `<@!${userId}> clicked ${count} times`)
        .join("\n")

      return [
        content,
        actionRowComponent(
          buttonComponent({
            label: "click it you won't",
            style: "SUCCESS",
            onClick: (event) => {
              const count = clickCounts.get(event.user.id) ?? 0
              clickCounts.set(event.user.id, count + 1)
            },
          }),
        ),
      ]
    })
  },
})
