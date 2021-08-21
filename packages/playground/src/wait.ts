import { promisify } from "node:util"

export const wait = promisify(setTimeout)
