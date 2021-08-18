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
  actionRowComponent,
  buttonComponent,
  createGatekeeper,
  defineSlashCommand,
} from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"

const counterCommand = defineSlashCommand({
  name: "counter",
  description: "make a counter",
  async run(context) {
    let count = 0

    await context.createReply(() => [
      `button pressed ${count} times`,
      actionRowComponent(
        buttonComponent({
          style: "PRIMARY",
          label: "press it",
          onClick: () => {
            count += 1
          },
        }),
      ),
    ])
  },
})

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

const gatekeeper = createGatekeeper({ debug: true })
gatekeeper.addSlashCommand(counterCommand)
gatekeeper.useClient(client, { useGuildCommands: true })

client.login(process.env.BOT_TOKEN).catch(console.error)
```

## [examples](./playground/src)

## todo

- ~~command arguments~~
- ~~pass more info to onClick/onSelect handlers, e.g. member~~
- ~~allow publishing global commands _and_ guild commands~~
- automatic actionRow placement
- explicit updates + reply instance state
- deferred reply
- cleanup of inactive command instances after 15 mins
- context menu stuff (?)
- deterministic component IDs per command (?)
