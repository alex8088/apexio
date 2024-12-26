import http from 'node:http'
import https from 'node:https'
import { promisify } from 'node:util'

import { isObject, isStream, isFormData, stripBOM } from './utils'
import { ApexioError } from './error'

import type { ApexioRequestConfig, ApexioResponse } from './types'

function buildURL(url: string, params?: any): string {
  if (!params) {
    return url
  }

  const qs =
    params instanceof URLSearchParams ? params : new URLSearchParams(params)

  return (url.indexOf('?') === -1 ? '?' : '&') + qs.toString()
}

export const request = async function <T>(
  config: ApexioRequestConfig<any>
): Promise<ApexioResponse<T>> {
  const url = new URL(buildURL(config.url, config.params), config.baseURL)

  const net = url.protocol === 'https:' ? https : http

  const options = config

  const noContentType = !options.headers['content-type']

  let data = config.data

  if (data) {
    if (isStream(data)) {
      if (isFormData(data)) {
        const headers = data.getHeaders()

        options.headers = {
          ...options.headers,
          ...headers
        }

        let contentLength = 0
        try {
          contentLength = await promisify(data.getLength.bind(data))()
        } catch {} /* eslint no-empty: 0 */

        if (Number.isFinite(contentLength) && contentLength >= 0) {
          options.headers['content-length'] = String(contentLength)
        }
      }
    } else {
      if (data instanceof URLSearchParams) {
        if (noContentType) {
          options.headers['content-type'] = 'application/x-www-form-urlencoded'
        }
        data = data.toString()
      } else if (isObject(data)) {
        if (noContentType) {
          options.headers['content-type'] = 'application/json'
          data = JSON.stringify(data)
        } else if (
          (options.headers['content-type'] as string).indexOf(
            'application/x-www-form-urlencoded'
          ) >= 0
        ) {
          data = new URLSearchParams(data as Record<string, string>).toString()
        }
      }
    }
  }

  return new Promise((resolve, reject) => {
    const request = net.request(url, options, (response) => {
      const _resolve = (data: T): void => {
        resolve({
          status: response.statusCode!,
          statusText: response.statusMessage || 'OK',
          headers: response.headers,
          config,
          data
        })
      }
      const _reject = (): void => {
        reject(
          new ApexioError(
            `Server responded with status code: ${response.statusCode}`,
            (response.statusCode || 0) < 500
              ? 'ERR_BAD_REQUEST'
              : 'ERR_BAD_RESPONSE',
            config,
            request,
            response
          )
        )
      }
      if (options.responseType === 'stream') {
        if (response.statusCode === 200) {
          _resolve(response as T)
        } else {
          _reject()
        }
      } else {
        const chunks: Buffer[] = []
        response.on('data', (chunk) => {
          chunks.push(Buffer.from(chunk))
        })
        response.on('end', () => {
          if (
            response.statusCode &&
            response.statusCode >= 200 &&
            response.statusCode < 300
          ) {
            let data = Buffer.concat(chunks).toString('utf-8')
            data = stripBOM(data)
            if (
              response.statusCode === 200 &&
              (!options.responseType || options.responseType === 'json')
            ) {
              try {
                data = JSON.parse(data)
              } catch (e) {
                if (options.responseType === 'json') {
                  reject(
                    ApexioError.from(
                      e as Error,
                      'ERR_BAD_RESPONSE',
                      config,
                      request,
                      response
                    )
                  )
                }
              }
            }

            _resolve(data as T)
          } else {
            _reject()
          }
        })
        response.on('error', (err) => {
          if (request.destroyed) return
          reject(ApexioError.from(err, 'ERR_ON_RESPONSE', config, request))
        })
      }
    })

    request.on('error', (err) => {
      reject(ApexioError.from(err, 'ERR_ON_REQUEST', config, request))
    })

    request.on('timeout', (e) => {
      request.destroy(e)
      const msg = config.timeout
        ? `timeout of ${config.timeout}ms exceede`
        : 'timeout exceeded'
      reject(new ApexioError(msg, 'ETIMEDOUT', config))
    })

    if (isStream(data)) {
      data.pipe(request)
    } else {
      request.end(data)
    }
  })
}
