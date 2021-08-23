# Getting Started

This guide assumes some familiarity with JavaScript (or TypeScript!), Node.JS, and Discord.JS.

## Setup

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

For a fast dev workflow, you can also use [node-dev](https://npm.im/node-dev):

```sh
npx node-dev bot.js
```

## Your first slash command

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

`context.reply(...)` sends out a message to everyone in the channel. If you only want the activating user to see the command, use `context.ephemeralReply(...)` instead.

```js
const pingCommand = gatekeeper.defineSlashCommand({
  name: "ping",
  description: "Pong!",
  run(context) {
    context.ephemeralReply(() => "Pong! (but only for you 💕)")
  },
})
```

Now add the command:

```js
instance.addCommand(pingCommand)
```

When you rerun the bot, you should see 'Registering slash command "ping"' in the console. Run the command, and you should get a `"Pong!"` back from the bot.

Congrats, you've just written your first command with Gatekeeper! 🎉

## Buttons!

Now, you might be wondering why you need a framework just for that. You'd be right, thinking that you could probably do this yourself, with not that much more code.

Gatekeeper really shines when making much more robustly interactive commands, using Discord's message component feature.

Let's take a `/counter` command, for example. It shows a button, tells you how many times you've clicked it, then gives another button to remove the message.

<details>

  <summary>Without gatekeeper, here's what you'd write. (click to expand)</summary>

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

There's a lot going on, and it's very easy to make a mistake here.

With gatekeeper, let's start out by **declaratively** describing what UI we want.

Instead of just a string, we'll use an array. The string will be the content of the message.

We'll use `buttonComponent` to tell gatekeeper we want our message to have buttons. We define a `label` for the button text, a `style` for the color and intent the button should have, then an `onClick` function, which gets called when the button is clicked.

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

> **Note:** Ephemeral (private) replies can't be edited or deleted by the bot, so they _won't_ return reply handles. But they can still be updated from clicks.

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

And with that, you should have a good baseline understanding of how Gatekeeper works. It's a flow of "receive command, create reply, update state". If you've used a frontend framework like React or Vue, you'll probably feel right at home.

This guide should cover other topics in the future, but for now, here are some examples:

- [Slash command arguments](/packages\playground\src\commands\double.ts)
- [Select menu (single selection)](/packages\playground\src\commands\select.ts)
- [Select menu (multiple selection)](/packages\playground\src\commands\multi-select.ts)
- [Using info from `onClick`](/packages\playground\src\commands\callback-info.ts)
- [Context menu commands for user](/packages\playground\src\commands\hug.ts)
- [Context menu commands for messages](/packages\playground\src\commands\spongebob.ts)
- [Deferring messages and/or clicks](/packages\playground\src\commands\defer.ts)
