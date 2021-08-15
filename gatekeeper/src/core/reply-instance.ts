import type { MessageComponentInteraction } from "discord.js"
import type { ReplyInstance } from "./command-handler"

export class ReplyManager {
  #instances = new Set<ReplyInstance>()

  async handleMessageComponentInteraction(
    interaction: MessageComponentInteraction,
  ) {
    interaction.deferUpdate().catch(console.warn)

    await Promise.all(
      [...this.#instances].map((instance) =>
        instance.handleMessageComponentInteraction(interaction),
      ),
    )
  }

  add(instance: ReplyInstance): ReplyInstance {
    this.#instances.add(instance)
    return instance
  }

  remove(instance: ReplyInstance): void {
    this.#instances.delete(instance)
  }
}
