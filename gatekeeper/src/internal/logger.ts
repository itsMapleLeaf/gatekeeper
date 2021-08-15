export interface Logger {
  info(...args: unknown[]): void
}

export class DebugLogger implements Logger {
  info(...args: unknown[]) {
    console.info("[INFO]", ...args)
  }
}

export class NoopLogger implements Logger {
  info() {}
}
