import { ClientRequest, IncomingMessage } from 'node:http'
import type { ApexioRequestConfig } from './types'

type ErrorCode =
  | 'ECONNABORTED'
  | 'ETIMEDOUT'
  | 'ERR_ON_REQUEST'
  | 'ERR_ON_RESPONSE'
  | 'ERR_BAD_REQUEST'
  | 'ERR_BAD_RESPONSE'

export class ApexioError extends Error {
  code: ErrorCode

  constructor(
    message: string,
    code: ErrorCode,
    readonly config?: ApexioRequestConfig,
    readonly request?: ClientRequest,
    readonly response?: IncomingMessage
  ) {
    super(message)
    this.name = 'ApexioError'
    this.code = code
  }

  static from(
    error: Error,
    code: ErrorCode,
    config?: ApexioRequestConfig,
    request?: ClientRequest,
    response?: IncomingMessage
  ): ApexioError {
    const _error = new ApexioError(
      error.message,
      code,
      config,
      request,
      response
    )

    _error.cause = error
    _error.name = error.name
    _error.stack = error.stack

    return _error
  }
}
