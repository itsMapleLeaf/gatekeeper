import {
  actionRowComponent,
  buttonComponent,
  defineSlashCommand,
} from "../../../gatekeeper/src/main"

export const kitchenSinkCommand = defineSlashCommand({
  name: "kitchen-sink",
  description: "stress testing",
  async run(context) {
    // {
    //   const reply = await context.reply(`hi`)
    //   await wait(1000)
    //   await reply.edit(`delete this`)
    //   await wait(1000)
    //   await reply.delete()
    // }

    await context.statefulReply({
      state: 0,
      render: (count) => [
        `count: ${count}`,
        actionRowComponent(
          buttonComponent({
            label: "click me",
            style: "PRIMARY",
            onClick: async (buttonContext) => {
              await buttonContext.setState((count) => count + 1)
              // await buttonContext.reply(
              //   `clicked by <@${buttonContext.user.id}>`,
              // )
              await buttonContext.ephemeralReply(
                "cool, you clicked the button!",
              )
            },
          }),
        ),
      ],
    })

    // await context.ephemeralReply(`first eph msg`)
    // await context.reply(`another public msg`)
    // await context.ephemeralReply(`this is  e p h e m e r a l`)
    // await context.reply(`another message`)
    // const reply = await context.statefulReply({
    //   state: 0,
    //   render: (count) => [
    //     `button pressed ${count} times`,
    //     actionRowComponent(
    //       buttonComponent({
    //         style: "PRIMARY",
    //         label: "press it",
    //         onClick: async (buttonContext) => {
    //           await buttonContext.setReplyState(count + 1)
    //         },
    //       }),
    //       buttonComponent({
    //         style: "SECONDARY",
    //         label: "done",
    //         onClick: async (buttonContext) => {
    //           if (buttonContext.user.id === context.user.id) {
    //             await buttonContext.deleteReply()
    //           } else {
    //             await buttonContext.ephemeralReply(`you can't do that`)
    //           }
    //         },
    //       }),
    //     ),
    //   ],
    // })
    // reply state can be arbitrarily updated
    // can't be done for ephems
    // reply.setState((count) => count + 1)
  },
})
