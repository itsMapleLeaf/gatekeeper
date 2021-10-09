import chalk from "chalk"
import type {
  BaseCommandInteraction,
  Client,
  Guild,
  MessageComponentInteraction,
} from "discord.js"
import glob from "fast-glob"
import { join, relative } from "node:path"
import type { Logger } from "../internal/logger"
import { createConsoleLogger, createNoopLogger } from "../internal/logger"
import type { Command } from "./command/command"
import { CommandInstance, isCommand } from "./command/command"

export type GatekeeperConfig = {
  client: Client
  name?: string
  logging?: boolean
  commands?: Command[]
  commandFolder?: string
}

export class Gatekeeper {
  private readonly commands = new Set<Command>()
  private readonly commandInstances = new Set<CommandInstance>()
  private readonly logger: Logger

  constructor(logger: Logger) {
    this.logger = logger
  }

  addCommand(command: Command) {
    this.commands.add(command)
  }

  addEventListeners(client: Client) {
    client.on(
      "ready",
      this.withErrorHandler(async () => {
        const commandList = [...this.commands]
          .map((command) => chalk.bold(command.name))
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
      this.withErrorHandler(async (interaction) => {
        if (interaction.isCommand() || interaction.isContextMenu()) {
          await this.handleCommandInteraction(interaction)
        }
        if (interaction.isMessageComponent()) {
          await this.handleComponentInteraction(interaction)
        }
      }),
    )
  }

  async loadCommandsFromFolder(folderPath: string) {
    // backslashes are ugly
    const localPath = relative(process.cwd(), folderPath).replace(/\\/g, "/")

    await this.logger.block(`Loading commands from ${localPath}`, async () => {
      const files = await glob(`./**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}`, {
        cwd: folderPath,
      })
      const loaded: string[] = []

      await Promise.all(
        files.map(async (filename) => {
          const mod = await import(join(folderPath, filename))
          for (const [, value] of Object.entries(mod)) {
            if (isCommand(value)) {
              this.addCommand(value)
              loaded.push(value.name)
            }
          }
        }),
      )
    })
  }

  private async syncGuildCommands(guild: Guild) {
    await this.logger.block(`Syncing commands for ${guild.name}`, async () => {
      const commandManager = guild.commands
      const existingCommands = await commandManager.fetch()

      // remove commands first,
      // just in case we've hit the max number of commands
      const commandsToRemove = existingCommands.filter((appCommand) => {
        const isUsingCommand = [...this.commands].some((command) => {
          return command.matchesExisting(appCommand)
        })
        return !isUsingCommand
      })
      if (commandsToRemove.size > 0) {
        this.logger.info(
          `Removing ${commandsToRemove.size} command(s) in ${guild.name}`,
        )
        for (const [, command] of commandsToRemove) {
          await command.delete()
        }
      }

      const commandsToCreate = [...this.commands].filter((command) => {
        const isExisting = existingCommands.some((appCommand) => {
          return command.matchesExisting(appCommand)
        })
        return !isExisting
      })
      if (commandsToCreate.length > 0) {
        this.logger.info(
          `Creating ${commandsToCreate.length} command(s) in ${guild.name}`,
        )
        for (const command of commandsToCreate) {
          await command.register(commandManager)
        }
      }
    })
  }

  private async handleCommandInteraction(interaction: BaseCommandInteraction) {
    const command = [...this.commands.values()].find((command) =>
      command.matchesInteraction(interaction),
    )
    if (!command) return

    this.logger.info("Running command", chalk.bold(command.name))

    const instance = new CommandInstance(command, this.logger)
    this.commandInstances.add(instance)

    try {
      await command.run(interaction, instance)
    } catch (error) {
      this.logger.error(`Error running command`, chalk.bold(command.name))
      this.logger.error(error)
    }
  }

  private async handleComponentInteraction(
    interaction: MessageComponentInteraction,
  ) {
    for (const context of this.commandInstances) {
      if (await context.handleComponentInteraction(interaction)) return
    }
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

export async function createGatekeeper({
  name = "gatekeeper",
  logging = true,
  ...config
}: GatekeeperConfig): Promise<Gatekeeper> {
  const instance = new Gatekeeper(
    logging ? createConsoleLogger({ name }) : createNoopLogger(),
  )

  if (config.commandFolder) {
    await instance.loadCommandsFromFolder(config.commandFolder)
  }

  for (const command of config.commands ?? []) {
    instance.addCommand(command)
  }

  instance.addEventListeners(config.client)

  return instance
}
