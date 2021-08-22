import { promisify } from "util"

export const wait = promisify(setTimeout)
