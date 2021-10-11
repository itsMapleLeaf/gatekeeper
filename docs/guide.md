# Guide

This guide should cover most of the things you'll want to do with Gatekeeper. It assumes some familiarity with JavaScript (or TypeScript!), Node.JS, and Discord.JS.

If you're completely new to discord bots in general, [see the Discord.JS guide first.](https://discordjs.guide/)

Consult the [API reference](https://itsmapleleaf.github.io/gatekeeper/api/) for more in-depth information on Gatekeeper.

## Motivation

Discord's message components (buttons, selects, etc.) are a really neat feature you can use to do some pretty crazy and wild things you couldn't before. However, working with them directly can feel a bit cumbersome.

<details>
  <summary>For example, let's take a messsage which counts the number of times you click a button, and another button to remove the message. This is the vanilla DJS code required for that. (click to expand)
    </summary>

```js
client.on("ready", async () => {
  for (const guild of client.guilds.cache.values()) {
    await guild.commands.create({
      name: "counter",
      description: "make a counter",
    })
  }
  console.info("ready")
})

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName !== "counter") return

  let count = 0

  const countButtonId = randomUUID()
  const doneButtonId = randomUUID()

  const message = (): InteractionReplyOptions => ({
    content: `button pressed ${count} times`,
    components: [
      {
        type: "ACTION_ROW",
        components: [
          {
            type: "BUTTON",
            style: "PRIMARY",
            label: "press it",
            customId: countButtonId,
          },
          {
            type: "BUTTON",
            style: "SECONDARY",
            label: "done",
            customId: doneButtonId,
          },
        ],
      },
    ],
  })

  const reply = (await interaction.reply({
    ...message(),
    fetchReply: true,
  })) as Message

  while (true) {
    const componentInteraction = await reply.awaitMessageComponent()

    if (
      componentInteraction.isButton() &&
      componentInteraction.customId === countButtonId
    ) {
      count += 1
      await componentInteraction.update(message())
    }

    if (
      componentInteraction.isButton() &&
      componentInteraction.customId === doneButtonId &&
      componentInteraction.user.id === interaction.user.id
    ) {
      await Promise.all([
        componentInteraction.deferUpdate(),
        interaction.deleteReply(),
      ])
      break
    }
  }
})
```

</details>

That's not to blame Discord.JS; I would say DJS is appropriately low-level here. But we can make this a little nicer, and that's where Gatekeeper comes in.

Gatekeeper leverages a **declarative UI** paradigm: you can describe what you want the view to look like, and it automatically manages creating and editing messages for you. Complex interactions become a lot more readable and easy to follow. Want to see how? Let's get started!

## Getting Started

1. [Create a bot application.](https://discordjs.guide/preparations/setting-up-a-bot-application.html)

1. [Invite your bot to a server.](https://discordjs.guide/preparations/adding-your-bot-to-servers.html#bot-invite-links)

1. Create a folder for your project, then install Gatekeeper alongside Discord.JS:

   ```bash
   mkdir my-awesome-bot
   cd my-awesome-bot
   npm init -y
   npm install discord.js @itsmapleleaf/gatekeeper
   ```

1. Create a new file `bot.js` and set up Discord.JS with the library:

   ```js
   const Discord = require("discord.js")
   const { Gatekeeper } = require("@itsmapleleaf/gatekeeper")

   const client = new Discord.Client({
     intents: [Discord.Intents.FLAGS.GUILDS],
   })

   // need this iffe for async/await
   // if you're using node.js ES modules, you don't need this!
   ;(async () => {
     const gatekeeper = await Gatekeeper.create({
       client,
     })

     // replace this with the bot token from your Discord application
     const botToken = "..."
     await client.login(botToken)
   })()
   ```

   > This is fine just for getting started, but if your project is a git repo, **do not** commit the bot token! Use a package like [dotenv](https://npm.im/dotenv), and put your token in the `.env` file:
   >
   > ```env
   > BOT_TOKEN="abcdef123"
   > ```
   >
   > Then add the file to your `.gitignore`. Reference the token with `process.env.BOT_TOKEN`.

1. Run the bot: `node bot.js`

If all went well, your bot should be up and running, and you should see some colorful debug messages in the console! If you find them distracting, you can always disable it by setting `logging: false`.

For a fast dev workflow, consider using [node-dev](https://npm.im/node-dev), which reruns your code on changes.

```sh
npx node-dev bot.js
```

## Tutorial - Your first slash command

To start things off, we'll write the classic `/ping` command, which responds with "pong!"

```js
const gatekeeper = await Gatekeeper.create({
  client,
})

// add commands *right after* creating the instance
gatekeeper.addSlashCommand({
  name: "ping",
  description: "Pong!",
  run(context) {
    context.reply(() => "Pong!")
  },
})
```

> You'll notice we're passing a function here, instead of `context.reply("Pong!")`. This is important, but we'll go over that later. Passing just the string will **not** work.

We use the `context` to create replies, and it also comes with some other info, like the `guild` where the command was ran, and the `user` that ran the command.

When you rerun the bot, you should see the ping command listed in the console. Run the command, and you should get a `"Pong!"` back from the bot.

Congrats, you've just written your first command with Gatekeeper! 🎉

## Tutorial - Buttons

Let's start out by **declaratively** describing what UI we want.

Return an array to specify multiple components to the message: message content, and two buttons. Use `buttonComponent` to define a button, and a few properties on each one:

- `label` - the text that shows on the button
- `style` - the intent of the button, or how it should look
- `onClick` - code to run when the button gets clicked

```js
const { buttonComponent } = require("@itsmapleleaf/gatekeeper")

gatekeeper.addSlashCommand({
  name: "counter",
  description: "Counts button presses",
  run(context) {
    context.reply(() => [
      `Button pressed 0 times`,
      buttonComponent({
        label: "+1",
        style: "PRIMARY",
        onClick: () => {}, // leave this empty for now!
      }),
      buttonComponent({
        label: "done",
        style: "SECONDARY",
        onClick: () => {}, // leave this empty for now!
      }),
    ])
  },
})
```

If you run the command, you'll get a message with some buttons, but they won't do anything yet.

Now we need to keep track of the current count. A variable works for that:

```js
gatekeeper.addSlashCommand({
  // ...
  run(context) {
    let count = 0

    // ...
  },
})
```

Then we can add one on click, and show the current count:

```js
const { buttonComponent } = require("@itsmapleleaf/gatekeeper")

gatekeeper.addSlashCommand({
  name: "counter",
  description: "Counts button presses",
  run(context) {
    let count = 0

    context.reply(() => [
      // show the count in the message
      `Button pressed ${count} times`,
      buttonComponent({
        label: "+1",
        style: "PRIMARY",
        onClick: () => {
          // add one to count
          count += 1
        },
      }),
      buttonComponent({
        label: "done",
        style: "SECONDARY",
        onClick: () => {},
      }),
    ])
  },
})
```

Now run `/counter` in Discord again. When you click the +1, you should see the count go up! We could even add +10 or +50 buttons if we wanted to.

Here's what happens:

1. Clicking the button sends an **interaction** to our bot. This interaction tells us which button was clicked.
1. With this information, Gatekeeper calls the button's `onClick` function, which increases the `count`.
1. Gatekeeper calls the function we sent to `reply()`, to know what the new messsage should look like. The message has an updated count.
1. Gatekeeper edits the message in Discord.

This is why it's important to pass a _function_ to reply. It allows Gatekeeper to re-call that function and update the message when needed.

With that, hopefully this looks easy to follow! And the "done" button won't take that much work either.

`reply()` returns a **handle** that we can use to delete the message:

```js
const { buttonComponent } = require("@itsmapleleaf/gatekeeper")

gatekeeper.addSlashCommand({
  // ...

  run(context) {
    // ...

    const handle = context.reply(() => [
      // ...

      buttonComponent({
        label: "done",
        style: "SECONDARY",
        onClick: () => {
          handle.delete()
        },
      }),
    ])
  },
})
```

Click "done", and the message should go away.

<details>

  <summary>Here's the final code. (click to expand)</summary>

```js
const { Gatekeeper, buttonComponent } = require("@itsmapleleaf/gatekeeper")

const gatekeeper = await Gatekeeper.create({
  /* ... */
})

gatekeeper.addSlashCommand({
  name: "counter",
  description: "Counts button presses",
  run(context) {
    let count = 0

    const handle = context.reply(() => [
      `Button pressed ${count} times`,
      buttonComponent({
        label: "+1",
        style: "PRIMARY",
        onClick: () => {
          count += 1
        },
      }),
      buttonComponent({
        label: "done",
        style: "SECONDARY",
        onClick: () => {
          handle.delete()
        },
      }),
    ])
  },
})
```

</details>

## Link Buttons

You can render link buttons using `linkComponent`.

```js
const { linkComponent } = require("@itsmapleleaf/gatekeeper")

gatekeeper.addSlashCommand({
  name: "cool-video",
  description: "shows a link to a cool video",
  run(context) {
    context.reply(() => [
      linkComponent({
        label: "here it is!",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      }),
    ])
  },
})
```

## Slash Command Options

Options are also called "arguments" or "parameters". You can use them to let users provide additional input to a command. Any option can be marked as `required: true`. For TypeScript users, this will make the type non-undefined.

### Basic types: string, number, boolean

```js
gatekeeper.addSlashCommand({
  name: "name",
  description: "what's your name?",
  options: {
    firstName: {
      type: "STRING",
      description: "your first name",
      required: true,
    },
    lastName: {
      type: "STRING",
      description: "your last name (optional)",
    },
    cool: {
      type: "BOOLEAN",
      description: "are you cool?",
    },
  },
  run(context) {
    const { firstName, lastName, cool } = context.options
    const displayName = [firstName, lastName].filter(Boolean).join(" ")
    const displayCool = cool ? `you are cool` : `you are not cool`

    context.reply(() => `Your name is ${displayName} and ${displayCool}`)
  },
})
```

For strings and numbers, you can define a limited set of values to choose from:

```js
gatekeeper.addSlashCommand({
  // ...
  options: {
    color: {
      type: "STRING",
      description: "pick a color",
      required: true,
      choices: [
        { name: "🔴 Red", value: "red" },
        { name: "🔵 Blue", value: "blue" },
        { name: "🟢 Green", value: "green" },
      ],
    },
    number: {
      type: "NUMBER",
      description: "pick a number",
      required: true,
      choices: [
        { name: "1️⃣ One", value: 1 },
        { name: "2️⃣ Two", value: 2 },
        { name: "3️⃣ Three", value: 3 },
        { name: "4️⃣ Four", value: 4 },
        { name: "5️⃣ Five", value: 5 },
      ],
    },
  },
})
```

> ⚠ As of writing, Discord errors on emoji-only choice names, and can sometimes bug out if you try to provide multiple options with choices

### Advanced types: user, role, channel

```js
gatekeeper.addSlashCommand({
  // ...
  options: {
    color: {
      type: "USER",
      description: "some user",
    },
    number: {
      type: "ROLE",
      description: "some role",
    },
    channel: {
      type: "CHANNEL",
      description: "some channel",
    },
  },
  run(context) {
    context.reply(() => [
      // resolves to DiscordJS User
      `user: ${context.options.user.name}`,

      // resolves to DiscordJS Role
      `role: ${context.options.role.name}`,

      // resolves to DiscordJS GuildChannel
      `channel: ${context.options.channel.name}`,
    ])
  },
})
```

### Advanced types: mentionable

```js
gatekeeper.addSlashCommand({
  // ...
  options: {
    target: {
      type: "MENTIONABLE",
      description: "a mentionable target",
    },
  },
  run(context) {
    if (target.isUser) {
      context.reply(() => [
        // convenience shorthand to show a mention in the message (pings the user/role)
        target.mention,
        `name: ${target.user.name}`,
        // guildMember is only available when invoked from guilds
        target.guildMember && `color: ${target.guildMember.displayHexColor}`,
      ])
    } else {
      context.reply(() => [
        target.mention,
        `name: ${target.role.name}`,
        `color: ${target.role.color}`,
      ])
    }
  },
})
```

## Loading commands from a folder

Loading commands from a folder is a convenient way to manage and create commands.

Let's assume you have this folder structure:

```
src/
  main.ts
  commands/
    ping.ts
```

A command file should export a function which adds commands to the gatekeeper instance.

```ts
// src/commands/ping.ts
import { Gatekeeper } from "@itsmapleleaf/gatekeeper"

export default function addCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "ping",
    description: "Pong!",
    run(context) {
      context.reply(() => "Pong!")
    },
  })
}
```

Then, pass an absolute path to the commands folder when creating the gatekeeper instance.

```ts
// src/main.ts
import { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { Client } from "discord.js"
import { join } from "node:path"

const client = new Client({
  intents: ["GUILD"],
})

;(async () => {
  await Gatekeeper.create({
    client,
    commandsFolder: join(__dirname, "commands"),
  })

  await client.login(process.env.BOT_TOKEN)
})()
```

Gatekeeper will load all commands from folder, and in nested folders within.

## More examples

- [Select menu (single selection)](/packages/playground/src/commands/select.ts)
- [Select menu (multiple selection)](/packages/playground/src/commands/multi-select.ts)
- [Using info from `onClick`](/packages/playground/src/commands/callback-info.ts)
- [Context menu commands for user](/packages/playground/src/commands/hug.ts)
- [Context menu commands for messages](/packages/playground/src/commands/spongebob.ts)
- [Deferring messages and/or clicks](/packages/playground/src/commands/defer.ts)
