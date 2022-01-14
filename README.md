**TL;DR:** Use [Reacord](https://github.com/itsMapleLeaf/reacord)

psst! This project isn't deprecated or anything (yet?), but I'm moving away from its development for a few reasons:

- The command handling part is limited, and doesn't accomodate the use cases that a decent portion of bots need, e.g. being able to add a command for individual guilds
- The reactivity part has gaps, and is also enforced in every case, including cases where it might be suboptimal

For that reason, I split out the reactivity part into a new library: [Reacord](https://github.com/itsMapleLeaf/reacord). It allows you to leverage JSX, react state, as well as the react ecosystem, and is much more powerful than what gatekeeper offers to accomplish the same goal. I would recommend using Reacord if declarative and reactive messages are what you're looking for.

For command handling, I can't recommend a library for that (yet?), but you'll probably be able to build your own [simple command handler](https://github.com/itsMapleLeaf/reacord/blob/main/packages/reacord/playground/command-handler.ts).

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
