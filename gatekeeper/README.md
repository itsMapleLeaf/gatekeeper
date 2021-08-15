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

you can find some example code in the [playground](./playground/src) folder
