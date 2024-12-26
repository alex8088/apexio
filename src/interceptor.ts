type Fulfilled<T> = (config: T) => Promise<T> | T

type Rejected<E> = (reason: E) => Promise<E>

export interface Hook<T, E> {
  fulfilled?: Fulfilled<T>
  rejected?: Rejected<E>
}

export class ApexioInterceptor<T, E> {
  hooks: Hook<T, E>[]

  constructor() {
    this.hooks = []
  }

  use(fulfilled: Fulfilled<T>, rejected: Rejected<E>): void {
    this.hooks.push({ fulfilled, rejected })
  }

  clear(): void {
    this.hooks = []
  }
}
