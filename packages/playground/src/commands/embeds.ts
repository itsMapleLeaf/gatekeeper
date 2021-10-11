import type { Gatekeeper } from "@itsmapleleaf/gatekeeper/src/main"
import { embedComponent } from "@itsmapleleaf/gatekeeper/src/main"
import type { EmbedFieldData } from "discord.js"

export default function defineCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addUserCommand({
    name: "Get User Info",
    run(context) {
      const fields: EmbedFieldData[] = []

      if (context.targetGuildMember) {
        fields.push({
          name: "Color",
          value: context.targetGuildMember.displayHexColor,
        })

        const roles = context.targetGuildMember.roles.cache.filter(
          (role) => role.name !== "@everyone",
        )

        if (roles.size > 0) {
          fields.push({
            name: "Roles",
            value: roles.map((role) => `<@&${role.id}>`).join(" "),
          })
        }
      }

      context.reply(() =>
        embedComponent({
          title:
            context.targetGuildMember?.displayName ??
            context.targetUser.username,
          color: context.targetGuildMember?.displayColor,
          thumbnail: {
            url: context.targetUser.avatarURL() ?? undefined,
          },
          fields,
        }),
      )
    },
  })
}
