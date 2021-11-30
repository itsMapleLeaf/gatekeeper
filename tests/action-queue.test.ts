import test from "ava"
import { ActionQueue } from "../src/internal/action-queue"
import { deferred } from "./helpers/deferred"

test("running prioritized actions before non-prioritized", async (t) => {
  const queue = new ActionQueue({
    onError: () => {},
  })

  let results: string[] = []
  let a = deferred()
  let b = deferred()

  queue.addAction({
    name: "prioritized",
    priority: 0,
    run: async () => {
      results.push("prioritized")
      a.resolve()
    },
  })

  queue.addAction({
    name: "non-prioritized",
    run: async () => {
      results.push("non-prioritized")
      b.resolve()
    },
  })

  await Promise.all([a, b])

  t.deepEqual(results, ["prioritized", "non-prioritized"])
})
