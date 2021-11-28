export type Deferred<T> = PromiseLike<T> & {
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
  promise: Promise<T>
}

export const deferred = <T = void>(): Deferred<T> => {
  let resolveFn: (value: T | PromiseLike<T>) => void
  let rejectFn: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolveFn = res
    rejectFn = rej
  })

  return {
    resolve: (value: T | PromiseLike<T>) => resolveFn(value),
    reject: (reason?: unknown) => rejectFn(reason),
    then: promise.then.bind(promise),
    promise,
  }
}
