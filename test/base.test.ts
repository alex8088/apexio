import fs from 'node:fs'
import { Readable } from 'node:stream'
import { beforeAll, afterAll, describe, it, expect, expectTypeOf } from 'vitest'
import FormData from 'form-data'

import { Apexio } from '../src/index'

import TestServer from './helper/server'

type Response<T> = {
  headers: { [key: string]: string }
  body?: T
}

const server = new TestServer()

let apexio: Apexio

beforeAll(async () => {
  await server.start()
  apexio = new Apexio({ baseURL: server.address })
  await apexio.options('/')
})

afterAll(async () => {
  await server.stop()
})

describe('request url', () => {
  it('should reject with error if protocol is unsupported', () => {
    expect(() => apexio.get('ftp://127.0.0.1/')).rejects.toThrowError(
      /^Protocol "ftp:" not supported/
    )
  })

  it('should reject with error if url is relative path and no base url', async () => {
    expect(() => new Apexio().get('/hello')).rejects.toThrowError(
      /^Invalid URL/
    )
  })

  it('should reject with error if url is invalid', async () => {
    expect(() => apexio.get('http://192.168.0.285')).rejects.toThrowError(
      /^Invalid URL/
    )
  })
})

describe('request methods', () => {
  it('should support GET methods', async () => {
    const res = await apexio.get('/')
    expect(res.status).toBe(200)
  })

  it('should support POST methods', async () => {
    const res = await apexio.post('/', {})
    expect(res.status).toBe(200)
  })

  it('should support DELETE methods', async () => {
    const res = await apexio.delete('/')
    expect(res.status).toBe(200)
  })

  it('should support PUT methods', async () => {
    const res = await apexio.put('/', {})
    expect(res.status).toBe(200)
  })

  it('should support HEAD methods', async () => {
    const res = await apexio.head('/')
    expect(res.status).toBe(200)
  })

  it('should support OPTIONS methods', async () => {
    const res = await apexio.options('/')
    expect(res.status).toBe(200)
  })
})

describe('request options', async () => {
  it('custom headers', async () => {
    const res = await apexio.get<Response<undefined>>('/headers', {
      headers: {
        'X-A': 'bar'
      }
    })
    expect(res.data.headers['x-a']).toBe('bar')
  })
})

describe('request data type', async () => {
  it('should allow POST request with JSON object', async () => {
    const res = await apexio.post<Response<{ foo: string }>>('/json', {
      foo: 'bar'
    })
    expect(res.headers['content-type']).to.equal('application/json')
    expect(res.data.headers['content-type']).to.equal('application/json')
    expect(res.data.body).toStrictEqual({ foo: 'bar' })
  })

  it('should allow POST request with URLSearchParams ', async () => {
    const params = new URLSearchParams()
    params.append('foo', 'bar')

    const res = await apexio.post<Response<string>>('/form', params)
    expect(res.data.headers['content-type']).to.equal(
      'application/x-www-form-urlencoded'
    )
    expect(res.data.body).toStrictEqual('foo=bar')
  })

  it('should allow POST request with URLSearchParams (2)', async () => {
    const res = await apexio.post<Response<string>>(
      '/form',
      { foo: 'bar' },
      { headers: { 'content-type': 'application/x-www-form-urlencoded' } }
    )
    expect(res.data.headers['content-type']).to.equal(
      'application/x-www-form-urlencoded'
    )
    expect(res.data.body).toStrictEqual('foo=bar')
  })

  it('should allow POST request with form-data', async () => {
    const form = new FormData()

    form.append('file', fs.createReadStream('test/fixtures/dummy.txt'), {
      filename: 'dummy.txt'
    })
    form.append('foo', '1')

    const res = await apexio.post<Response<string>>('/multipart', form)

    const r = res.data

    expect(r.headers['content-type']).toMatch(
      /^multipart\/form-data; boundary=/
    )
    expect(r.headers['content-length']).not.toBeUndefined()
    expect(r.body).toContain('file=dummy.txt')
    expect(r.body).toContain('foo=1')
  })
})

describe('response type', async () => {
  it('should resolve into response', async () => {
    const res = await apexio.get('/')
    expect(res.status).toBe(200)
    expect(res.statusText).toBe('OK')
    expect(res.data).toBe('Hello')
    expect(res).toHaveProperty('config')
    expect(res).toHaveProperty('headers')
  })

  it('should accept plain text response', async () => {
    const res = await apexio.get<string>('/plain')
    expect(res.headers['content-type']).toBe('text/plain')
    expect(res.data).toBe('hello')
  })

  it('should accept json response', async () => {
    const res = await apexio.post<Response<{ foo?: string }>>('/json', {
      foo: 'bar'
    })
    expect(res.headers['content-type']).toBe('application/json')
    expectTypeOf(res.data).toBeObject()
  })

  it('should accept stream response', async () => {
    const res = await apexio.post<Readable>(
      '/stream',
      {},
      { responseType: 'stream' }
    )

    const rs = fs.createWriteStream('test/fixtures/dummy-temp.txt')

    res.data.pipe(rs).on('close', () => {
      const size = fs.statSync('test/fixtures/dummy-temp.txt').size
      expect(size).toBeGreaterThan(0)
      fs.unlinkSync('test/fixtures/dummy-temp.txt')
    })
  })
})

describe('response error', async () => {
  it('should reject with error code ERR_BAD_REQUEST', () => {
    expect(() => apexio.get('/error/400')).rejects.toHaveProperty(
      'code',
      'ERR_BAD_REQUEST'
    )
  })

  it('should reject with error code ERR_BAD_RESPONSE', () => {
    expect(() => apexio.get('/error/500')).rejects.toHaveProperty(
      'code',
      'ERR_BAD_RESPONSE'
    )
  })
})

describe('interceptor', () => {
  it('request interceptor', async () => {
    apexio.interceptors.request.use(
      (config) => {
        config.headers['x-a'] = 'foo'
        return config
      },
      (err) => {
        return Promise.reject(err)
      }
    )

    const res = await apexio.post('/json', {})

    apexio.interceptors.request.clear()

    expect(apexio.interceptors.request.hooks.length).toBe(0)
    expect(res.data.headers['x-a']).toBe('foo')
  })

  it('response interceptor', async () => {
    apexio.interceptors.response.use(
      (res) => {
        res.data.body = { foo: 'zoo' }
        return res
      },
      (err) => {
        return Promise.reject(err)
      }
    )
    const res = await apexio.post<Response<{ foo?: string }>>('/json', {
      foo: 'bar'
    })

    apexio.interceptors.response.clear()

    expect(apexio.interceptors.response.hooks.length).toBe(0)
    expect(res.data.body).toStrictEqual({ foo: 'zoo' })
  })
})

it('should set default user-agent', async () => {
  const res = await apexio.get<Response<undefined>>('/headers')
  expect(res.data.headers['user-agent']).toMatch('apexio')
})

it('should be timeout without response with timeout', async () => {
  expect(() =>
    apexio.post<Response<{ foo: string }>>('/timeout', null, {
      timeout: 300
    })
  ).rejects.toThrowError(/^timeout/)
})

it('should handle split Chinese characters correctly', async () => {
  const res = await apexio.get('/chinese')
  expect(res.data).toEqual('中')
})
