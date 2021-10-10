# gatekeeper

Gatekeeper is a ✨reactive✨ interaction framework for discord.js!

- [Guide](./docs/guide.md)
- [Examples](./packages/playground/src/commands)
- [API Docs](https://itsmapleleaf.github.io/gatekeeper/api/)

Install:

```sh
# npm
npm install @itsmapleleaf/gatekeeper discord.js

# yarn
yarn add @itsmapleleaf/gatekeeper discord.js

# pnpm
pnpm add @itsmapleleaf/gatekeeper discord.js
```

Here's a taste of what Gatekeeper looks like:

```js
import { buttonComponent, Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"

void (async () => {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
  })

  const gatekeeper = await Gatekeeper.create({
    client,
  })

  gatekeeper.addSlashCommand({
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

  await client.login(process.env.BOT_TOKEN)
})()
```

And a silly example, demonstrating the power of the library. [You can find the code here](./packages/playground/src/commands/counter-factory.ts)

![showcase](./showcase.gif)
