import { buttonComponent } from "@itsmapleleaf/gatekeeper/src/core.new/button-component"
import { createGatekeeper } from "@itsmapleleaf/gatekeeper/src/core.new/gatekeeper"
import type { InteractionContext } from "@itsmapleleaf/gatekeeper/src/core.new/interaction-context"
import { defineUserCommand } from "@itsmapleleaf/gatekeeper/src/core.new/user-command"
import { Client, Intents } from "discord.js"
import "dotenv/config"
import { setTimeout } from "node:timers/promises"

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

createGatekeeper({
  client,
  commands: [
    defineUserCommand({
      name: "hug",
      async run(context) {
        const reply = context.reply(() => "the")
        await setTimeout(1000)
        reply.delete()
      },
    }),

    defineUserCommand({
      name: "countdown",
      async run(context) {
        let count = 5
        const reply = context.reply(() => count)

        do {
          await setTimeout(1000)
          count -= 1
          reply.refresh()
        } while (count > 0)

        await setTimeout(1000)
        reply.delete()
      },
    }),

    defineUserCommand({
      name: "counter",
      async run(context) {
        let count = 0
        context.ephemeralReply(() => [
          `count: ${count}`,
          buttonComponent({
            label: `add 1 (${count})`,
            style: "PRIMARY",
            onClick: () => {
              count += 1
            },
          }),
        ])
      },
    }),

    defineUserCommand({
      name: "message factory",
      async run(context) {
        function createReply(context: InteractionContext) {
          const reply = context.reply(() => [
            buttonComponent({
              label: "create message",
              style: "PRIMARY",
              onClick: (context) => {
                createReply(context)
              },
            }),
            buttonComponent({
              label: "delete",
              style: "DANGER",
              onClick: () => {
                reply.delete()
              },
            }),
          ])
        }

        createReply(context)
      },
    }),

    // defineUserCommand({
    //   name: "defertest",
    //   async run(context) {
    //     context.ephemeralDefer()
    //     context.reply(() => "this should be public")
    //     context.ephemeralReply(() => "this should be private")
    //   },
    // }),

    defineUserCommand({
      name: "error",
      async run(context) {
        throw new Error("lol")
      },
    }),
  ],
})

// eslint-disable-next-line no-console
client.login(process.env.BOT_TOKEN).catch(console.error)
