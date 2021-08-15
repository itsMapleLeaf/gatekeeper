# hey

gatekeeper is a ✨reactive✨ interaction framework for discord.js and it's very not done don't use it

maybe more docs later

![showcase](./showcase.gif)

## todo

- command arguments
- pass more info to onClick/onSelect handlers, e.g. member
- deferred reply
- cleanup of inactive command instances after 15 mins
- allow publishing global commands _and_ guild commands
- context menu stuff?

## usage

```ts
import { applyCommands, CommandHandler } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"

const commands: CommandHandler[] = [
  // list of commands here
]

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

applyCommands(client, commands)

client.on("ready", () => {
  console.info("bot running ayy lmao")
})

await client.login(process.env.BOT_TOKEN).catch(console.error)
```

## examples

you can find some example code in the [playground](./playground) directory

### ping

```js
const commands: CommandHandler[] = [
  {
    name: "ping",
    description: "pong",
    async run(context) {
      await context.createReply(() => ["pong!"])
    },
  },
]
```

### counter

creates a `/counter` command which responds with a counter button. each counter button has its own count. try running it multiple times!

```js
export const counterCommand = {
  name: "counter",
  description: "make a counter",
  async run(context) {
    let count = 0
    let state = "running"

    const reply = await context.createReply(() => {
      if (state === "done") {
        return ["well fine then"]
      }

      if (state === "deleted") {
        return
      }

      return [
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
            label: "i'm bored",
            onClick: async () => {
              state = "done"
              await reply.update()

              await wait(1000)

              state = "deleted"
              await reply.update()
            },
          }),
        ),
      ]
    })
  },
}
```
