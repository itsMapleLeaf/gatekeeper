import type {
  ApplicationCommand,
  ApplicationCommandManager,
  GuildApplicationCommandManager,
} from "discord.js"

type DiscordCommandManager =
  | ApplicationCommandManager
  | GuildApplicationCommandManager

export type Command = {
  name: string
  matchesExisting: (appCommand: ApplicationCommand) => boolean
  register: (commandManager: DiscordCommandManager) => Promise<void>
}
