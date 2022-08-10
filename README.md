# This project is deprecated

**TL;DR:** Use [Reacord](https://github.com/itsMapleLeaf/reacord)

I'm moving away from this project's development for a few reasons:

- The command handling part is limited, and doesn't accomodate the use cases that a decent portion of bots need, e.g. being able to add a command for individual guilds
- The reactivity part has gaps, and also makes you use it everywhere with no opt-out

For that reason, I split out the reactivity part into a new library: [Reacord](https://github.com/itsMapleLeaf/reacord). It allows you to leverage JSX, react state, as well as the react ecosystem, and is much more powerful than what gatekeeper offers to accomplish the same goal. I would recommend using Reacord if you want declarative, highly interactive messages.

For command handling, I can't recommend a library for that (yet?), but you can build your own simple command handler: [(1)](https://github.com/itsMapleLeaf/bae/blob/62c6d6fd2983f3f5e60c2a6619f48d38030c79da/src/helpers/commands.ts) [(2)](https://github.com/itsMapleLeaf/bae/blob/62c6d6fd2983f3f5e60c2a6619f48d38030c79da/src/main.tsx#L14-L62)

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

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

;(async () => {
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
