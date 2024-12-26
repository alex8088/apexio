import type { Readable } from 'node:stream'

export function isObject(val): val is object {
  return val != null && typeof val === 'object'
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function'
}

export type NodeStream = {
  pipe<T extends NodeJS.WritableStream>(
    destination: T,
    options?: { end?: boolean }
  ): T
} & NodeJS.EventEmitter

export const isStream = (val): val is NodeStream => {
  return isObject(val) && isFunction((val as NodeStream).pipe)
}

export type FormData = {
  getHeaders: () => {
    [key: string]: any
  }
  getLength: (callback: (error: Error | null, length: number) => void) => void
} & Readable

export const isFormData = (val): val is FormData => {
  return isStream(val) && isFunction((val as FormData).getHeaders)
}
