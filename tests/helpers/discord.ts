import Discord from "discord.js"

export function createMockClient() {
  const client = new Discord.Client({ intents: [] })

  client.users.cache.set("123", {
    id: "123",
    username: "test",
    discriminator: "1234",
    bot: false,
    createdAt: new Date(),
  } as any)

  return client
}
