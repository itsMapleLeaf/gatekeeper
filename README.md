# gatekeeper

Gatekeeper is a ✨reactive✨ interaction framework for discord.js!

- [Guide](./docs/guide.md)
- [Examples](./packages/playground/src/commands)
- [API Docs](https://itsmapleleaf.github.io/gatekeeper/api/)

Here's a taste of what Gatekeeper looks like:

```js
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

And a silly example, demonstrating the power of the library. [You can find the code here](./packages/playground/src/commands/counter-factory.ts)

![showcase](./showcase.gif)
