# gatekeeper

gatekeeper is a ✨reactive✨ interaction framework for discord.js!

it's a rough work in progress; things will probably change a lot before an actual release. but feel free to try it out and give feedback!

![showcase](./showcase.gif)

## install

```sh
npm install @itsmapleleaf/gatekeeper@next
```

(or with your favorite package manager)

## usage

```ts
import {
  buttonComponent,
  createGatekeeper,
  defineSlashCommand,
} from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"

const counterCommand = defineSlashCommand({
  name: "counter",
  description: "make a counter",
  run(context) {
    let count = 0

    context.reply(() => [
      `button pressed ${count} times`,
      buttonComponent({
        style: "PRIMARY",
        label: "press it",
        onClick: () => {
          count += 1
        },
      }),
    ])
  },
})

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

const gatekeeper = createGatekeeper({ debug: true })
gatekeeper.addCommand(counterCommand)
gatekeeper.useClient(client)

client.login(process.env.BOT_TOKEN).catch(console.error)
```

## [examples](./packages/playground/src/commands)

proper documentation and a guide will come later!
