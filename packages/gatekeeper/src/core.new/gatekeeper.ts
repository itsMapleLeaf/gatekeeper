import chalk from "chalk"
import type { Client, Guild } from "discord.js"
import { createConsoleLogger } from "../internal/logger"
import type { Command } from "./command"

export type GatekeeperConfig = {
  client: Client
  commands?: Command[]
}

type ReplyInstance = {}

export type { Gatekeeper }
class Gatekeeper {
  private readonly commands = new Map<string, Command>()
  private readonly replyInstances = new Set<ReplyInstance>()
  private readonly logger = createConsoleLogger({ name: "gatekeeper" })

  addCommand(command: Command) {
    this.commands.set(command.name, command)
  }

  private addReplyInstance(instance: ReplyInstance) {
    this.replyInstances.add(instance)
  }

  addEventListeners(client: Client) {
    client.on(
      "ready",
      this.withErrorHandler(async () => {
        const commandList = [...this.commands.keys()]
          .map((name) => chalk.bold(name))
          .join(", ")

        this.logger.success(`Using commands: ${commandList}`)

        await Promise.all(
          client.guilds.cache.map((guild) => this.syncGuildCommands(guild)),
        )
      }),
    )

    client.on(
      "guildCreate",
      this.withErrorHandler(async (guild) => {
        await this.syncGuildCommands(guild)
      }),
    )

    client.on(
      "interactionCreate",
      this.withErrorHandler((interaction) => {
        // handle interaction
      }),
    )
  }

  private async syncGuildCommands(guild: Guild) {
    await this.logger.block(`Syncing commands for ${guild.name}`, async () => {
      const commandManager = guild.commands
      const existingCommands = await commandManager.fetch()

      const commandsToCreate = [...this.commands.values()].filter((command) => {
        const isExisting = existingCommands.some((appCommand) => {
          return command.matchesExisting(appCommand)
        })
        return !isExisting
      })
      if (commandsToCreate.length > 0) {
        this.logger.info(
          `Creating ${commandsToCreate.length} command(s) in ${guild.name}`,
        )
        await Promise.all(
          commandsToCreate.map((command) => command.register(commandManager)),
        )
      }

      const commandsToRemove = existingCommands.filter((appCommand) => {
        const isUsingCommand = [...this.commands.values()].some((command) => {
          return command.matchesExisting(appCommand)
        })
        return !isUsingCommand
      })
      if (commandsToRemove.size > 0) {
        this.logger.info(
          `Removing ${commandsToRemove.size} command(s) in ${guild.name}`,
        )
        await Promise.all(
          commandsToRemove.map((appCommand) =>
            commandManager.delete(appCommand.id),
          ),
        )
      }
    })
  }

  private withErrorHandler<Args extends unknown[], Return>(
    fn: (...args: Args) => Promise<Return> | Return,
  ) {
    return async (...args: Args) => {
      try {
        return await fn(...args)
      } catch (error) {
        this.logger.error("An error occurred:", error)
      }
    }
  }
}

export function createGatekeeper(config: GatekeeperConfig): Gatekeeper {
  const instance = new Gatekeeper()

  for (const command of config.commands ?? []) {
    instance.addCommand(command)
  }

  instance.addEventListeners(config.client)

  return instance
}
