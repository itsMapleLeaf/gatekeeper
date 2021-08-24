# Guide

This guide should cover most of the things you'll want to do with Gatekeeper. It assumes some familiarity with JavaScript (or TypeScript!), Node.JS, and Discord.JS. Consult the [API reference](https://itsmapleleaf.github.io/gatekeeper/api/).

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
   const gatekeeper = require("@itsmapleleaf/gatekeeper")

   const client = new Discord.Client({
     intents: [Discord.Intents.FLAGS.GUILDS],
   })

   const instance = gatekeeper.createGatekeeper({ debug: true })
   instance.useClient(client)

   // replace this with the bot token from your Discord application
   const botToken = "..."
   client.login(botToken).catch(console.error)
   ```

   > This is fine just for getting started, but if your project is a git repo, **do not** commit the bot token! Use a package like [dotenv](https://npm.im/dotenv), and put your token in the `.env` file:
   >
   > ```env
   > BOT_TOKEN="abcdef123"
   > ```
   >
   > Then add the file to your `.gitignore`. Reference the token with `process.env.BOT_TOKEN`.

1. Run the bot: `node bot.js`

If all went well, your bot should be up and running, and you should see some colorful debug messages in the console! If you find them distracting, you can always disable it by setting `debug: false`.

For a fast dev workflow, consider using [node-dev](https://npm.im/node-dev), which reruns your code on changes.

```sh
npx node-dev bot.js
```

## Tutorial - Your first slash command

To start things off, we'll write the classic `/ping` command, which responds with "pong!"

Use `defineSlashCommand` to define the command. A name and description for the command is required.

```js
const pingCommand = gatekeeper.defineSlashCommand({
  name: "ping",
  description: "Pong!",
  run(context) {
    context.reply(() => "Pong!")
  },
})
```

> You'll notice we're passing a function here, instead of just calling `context.reply("Pong!")`. This is important, but we'll go over that later. Passing just the string will **not** work.

We use the `context` to reply to commands, and it also comes with some other info, like the guild where the command was ran, and the user that ran the command.

Now add the command:

```js
instance.addCommand(pingCommand)
```

When you rerun the bot, you should see 'Registering slash command "ping"' in the console. Run the command, and you should get a `"Pong!"` back from the bot.

Congrats, you've just written your first command with Gatekeeper! 🎉

## Tutorial - Buttons

Let's start out by **declaratively** describing what UI we want.

Return an array to specify multiple components to the message: message content, and two buttons. Use `buttonComponent` to define a button, and a few properties on each one:

- `label` - the text that shows on the button
- `style` - the intent of the button, or how it should look
- `onClick` - code to run when the button gets clicked

```js
const counterCommand = gatekeeper.defineSlashCommand({
  name: "counter",
  description: "Counts button presses",
  run(context) {
    context.reply(() => [
      `Button pressed 0 times`,
      gatekeeper.buttonComponent({
        label: "+1",
        style: "PRIMARY",
        onClick: () => {}, // leave this empty for now!
      }),
      gatekeeper.buttonComponent({
        label: "done",
        style: "SECONDARY",
        onClick: () => {}, // leave this empty for now!
      }),
    ])
  },
})
instance.addCommand(counterCommand)
```

If you run the command, you'll get a message with some buttons, but they won't do anything yet.

Now we need to keep track of the current count. A variable works for that:

```js
const counterCommand = gatekeeper.defineSlashCommand({
  // ...
  run(context) {
    let count = 0

    // ...
  },
})
```

Then we can add one on click, and show the current count:

```js
const counterCommand = gatekeeper.defineSlashCommand({
  name: "counter",
  description: "Counts button presses",
  run(context) {
    let count = 0

    context.reply(() => [
      // show the count in the message
      `Button pressed ${count} times`,
      gatekeeper.buttonComponent({
        label: "+1",
        style: "PRIMARY",
        onClick: () => {
          // add one to count
          count += 1
        },
      }),
      gatekeeper.buttonComponent({
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
const counterCommand = gatekeeper.defineSlashCommand({
  // ...

  run(context) {
    // ...

    const handle = context.reply(() => [
      // ...

      gatekeeper.buttonComponent({
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
const counterCommand = gatekeeper.defineSlashCommand({
  name: "counter",
  description: "Counts button presses",
  run(context) {
    let count = 0

    const handle = context.reply(() => [
      `Button pressed ${count} times`,
      gatekeeper.buttonComponent({
        label: "+1",
        style: "PRIMARY",
        onClick: () => {
          count += 1
        },
      }),
      gatekeeper.buttonComponent({
        label: "done",
        style: "SECONDARY",
        onClick: () => {
          handle.delete()
        },
      }),
    ])
  },
})
instance.addCommand(counterCommand)
```

</details>

## Slash Command Options

Options are also called "arguments" or "parameters". You can use them to let users provide additional input to a command. Any option can be marked as `required: true`. For TypeScript users, this will make the type non-undefined.

### Basic types: string, number, boolean

```js
const nameCommand = defineSlashCommand({
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
defineSlashCommand({
  // ...
  options: {
    color: {
      type: "STRING",
      description: "pick a color",
      required: true,
      choices: [
        { name: "🔴", value: "red" },
        { name: "🔵", value: "blue" },
        { name: "🟢", value: "green" },
      ],
    },
    number: {
      type: "NUMBER",
      description: "pick a number",
      required: true,
      choices: [
        { name: "1️⃣", value: 1 },
        { name: "2️⃣", value: 2 },
        { name: "3️⃣", value: 3 },
        { name: "4️⃣", value: 4 },
        { name: "5️⃣", value: 5 },
      ],
    },
  },
})
```

### Advanced types: user, role, channel

```js
defineSlashCommand({
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
defineSlashCommand({
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

## More examples

- [Select menu (single selection)](/packages/playground/src/commands/select.ts)
- [Select menu (multiple selection)](/packages/playground/src/commands/multi-select.ts)
- [Using info from `onClick`](/packages/playground/src/commands/callback-info.ts)
- [Context menu commands for user](/packages/playground/src/commands/hug.ts)
- [Context menu commands for messages](/packages/playground/src/commands/spongebob.ts)
- [Deferring messages and/or clicks](/packages/playground/src/commands/defer.ts)
