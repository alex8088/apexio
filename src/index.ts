import { ApexioInterceptor } from './interceptor'
import { request } from './request'
import { version } from '../package.json'

import type {
  ApexioDefaults,
  ApexioMethod,
  ApexioRequestOptions,
  ApexioRequestConfig,
  ApexioResponse
} from './types'

export type * from './types'

export * from './error'

export class Apexio {
  interceptors = {
    request: new ApexioInterceptor<ApexioRequestConfig, any>(),
    response: new ApexioInterceptor<ApexioResponse, any>()
  }

  constructor(public defaults: ApexioDefaults = {}) {}

  private mergeDefaults(options?: ApexioRequestOptions): ApexioRequestOptions {
    return {
      ...this.defaults,
      ...options,
      headers: {
        accept: 'application/json, text/plain, */*',
        'user-agent': `apexio/${version}`,
        ...this.defaults.headers,
        ...options?.headers
      }
    }
  }

  private async _request<T>(
    method: ApexioMethod,
    url: string,
    data: any,
    options?: ApexioRequestOptions
  ): Promise<ApexioResponse<T>> {
    const config = {
      ...this.mergeDefaults(options),
      data,
      method,
      url
    }

    const chain: any = [request, undefined]

    this.interceptors.request.hooks.forEach(({ fulfilled, rejected }) => {
      chain.unshift(fulfilled, rejected)
    })

    this.interceptors.response.hooks.forEach(({ fulfilled, rejected }) => {
      chain.push(fulfilled, rejected)
    })

    let promise: Promise<unknown> = Promise.resolve(config)

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift())
    }

    return promise as Promise<ApexioResponse<T>>
  }

  post<T = any>(
    url: string,
    data?: any,
    options?: ApexioRequestOptions
  ): Promise<ApexioResponse<T>> {
    return this._request<T>('POST', url, data, options)
  }

  get<T = any>(
    url: string,
    options?: ApexioRequestOptions
  ): Promise<ApexioResponse<T>> {
    return this._request<T>('GET', url, null, options)
  }

  delete<T = any>(
    url: string,
    options?: ApexioRequestOptions
  ): Promise<ApexioResponse<T>> {
    return this._request<T>('DELETE', url, null, options)
  }

  put<T = any>(
    url: string,
    data?: any,
    options?: ApexioRequestOptions
  ): Promise<ApexioResponse<T>> {
    return this._request<T>('PUT', url, data, options)
  }

  head<T = any>(
    url: string,
    options?: ApexioRequestOptions
  ): Promise<ApexioResponse<T>> {
    return this._request<T>('HEAD', url, null, options)
  }

  options<T = any>(
    url: string,
    options?: ApexioRequestOptions | undefined
  ): Promise<ApexioResponse<T>> {
    return this._request<T>('OPTIONS', url, null, options)
  }
}
