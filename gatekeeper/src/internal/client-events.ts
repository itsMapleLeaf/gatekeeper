import type { Client, ClientEvents } from "discord.js"
import { toError } from "./helpers.js"

export type ClientEventMap = {
  [EventName in keyof ClientEvents]?: (...args: ClientEvents[EventName]) => void | Promise<unknown>
}

export function bindClientEvents(client: Client, events: ClientEventMap) {
  for (const [eventName, callback] of Object.entries(events)) {
    client.on(eventName, async (...args) => {
      try {
        await callback(...(args as never[]))
      } catch (error) {
        const { message, stack } = toError(error)
        console.error(`An error occurred running ${eventName} ${stack || message}`)
      }
    })
  }
}
