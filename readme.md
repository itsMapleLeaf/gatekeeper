# hey

this is a slash command framework for discord.js and it's very not done don't use it

maybe more docs later

## usage

```ts
import {
  actionRowComponent,
  applyCommands,
  buttonComponent,
  CommandHandler,
} from "@itsmapleleaf/gatekeeper"
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

### ping

```ts
const commands: CommandHandler[] = [
  {
    name: "ping",
    description: "pong",
    async run(context) {
      await context.addReply("pong!")
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
    const reply = await context.defer()

    let count = 0
    let running = true

    do {
      await reply.edit(
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
            onClick: () => {
              running = false
            },
          })
        )
      )
    } while (running)

    await reply.edit("well fine then")
  },
}
```
