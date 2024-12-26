import type {
  RequestOptions as HttpRequestOptions,
  IncomingHttpHeaders
} from 'node:http'
import type { RequestOptions as HttpsRequestOptions } from 'node:https'

export type ApexioMethod =
  | 'GET'
  | 'POST'
  | 'DELETE'
  | 'PUT'
  | 'HEAD'
  | 'OPTIONS'

export type ApexioResponseType = 'text' | 'json' | 'stream'

type RequestOptions = Omit<HttpRequestOptions | HttpsRequestOptions, 'method'>

export type ApexioDefaults = {
  baseURL?: string
  responseType?: ApexioResponseType
} & RequestOptions

export type ApexioRequestOptions = {
  params?: any
  responseType?: ApexioResponseType
} & RequestOptions

export type ApexioRequestConfig<T = any> = {
  url: string
  method: ApexioMethod
  baseURL?: string
  responseType?: ApexioResponseType
  data?: T
  params?: any
} & Omit<RequestOptions, 'header'> &
  Required<Pick<RequestOptions, 'headers'>>

export interface ApexioResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: IncomingHttpHeaders
  config: ApexioRequestConfig
}
