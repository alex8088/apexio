import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { once } from 'node:events'
import busboy from 'busboy'

export default class TestServer {
  server: http.Server
  hostname = 'localhost'

  constructor() {
    this.server = http.createServer(this.router)
    this.server.on('error', (err) => {
      console.log(err.stack)
    })
    process.on('uncaughtException', (err) => {
      console.log(err.stack)
    })
  }

  async start(): Promise<any[]> {
    this.server.listen(0, this.hostname)

    return once(this.server, 'listening')
  }

  async stop(): Promise<any[]> {
    this.server.close()
    return once(this.server, 'close')
  }

  get address(): string {
    const addr = this.server.address()
    if (addr && typeof addr !== 'string') {
      return `http://${this.hostname}:${addr.port}`
    }
    return ''
  }

  private router(
    request: http.IncomingMessage,
    res: http.ServerResponse<http.IncomingMessage> & {
      req: http.IncomingMessage
    }
  ): void {
    const p = request.url

    if (p === '/') {
      res.statusCode = 200
      res.end('Hello')
    }

    if (p === '/headers') {
      res.statusCode = 200
      res.setHeader('content-type', 'application/json')
      res.end(
        JSON.stringify({
          headers: request.headers
        })
      )
    }

    if (p === '/plain') {
      res.statusCode = 200
      res.setHeader('content-type', 'text/plain')
      res.end('hello')
    }

    if (p === '/json') {
      res.statusCode = 200
      res.setHeader('content-type', 'application/json')
      let body = ''
      request.on('data', (c) => {
        body += c
      })
      request.on('end', () => {
        res.end(
          JSON.stringify({
            headers: request.headers,
            body: JSON.parse(body)
          })
        )
      })
    }

    if (p === '/form') {
      res.statusCode = 200
      res.setHeader('content-type', 'application/json')
      let body = ''
      request.on('data', (c) => {
        body += c
      })
      request.on('end', () => {
        res.end(
          JSON.stringify({
            headers: request.headers,
            body
          })
        )
      })
    }

    if (p === '/multipart') {
      let body = ''
      res.statusCode = 200
      res.setHeader('content-type', 'application/json')

      const bb = busboy({ headers: request.headers })

      bb.on('file', async (fieldName, file, info) => {
        body += `${fieldName}=${info.filename}`

        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-empty
        for await (const c of file) {
        }
      })
      bb.on('field', async (fieldName, value) => {
        body += `${fieldName}=${value}`
      })
      bb.on('error', (err) => {
        console.log(err)
      })
      bb.on('close', () => {
        res.end(
          JSON.stringify({
            headers: request.headers,
            body
          })
        )
      })

      request.pipe(bb)
    }

    if (p === '/stream') {
      const filePath = path.join('test/fixtures/dummy.txt')

      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition':
          'attachment; filename=' + path.basename(filePath),
        'Content-Length': fs.statSync(filePath).size
      })

      const readStream = fs.createReadStream(filePath)

      readStream.pipe(res)

      readStream.on('error', () => {
        res.statusCode = 500
        res.end()
      })

      res.on('close', () => {
        readStream.destroy()
      })
    }

    if (p === '/timeout') {
      setTimeout(() => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/plain')
        res.end('text')
      }, 1000)
    }

    if (p === '/slow') {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/plain')
      res.write('test')
      setTimeout(() => {
        res.end('test')
      }, 500)
    }

    if (p === '/chinese') {
      res.setHeader('content-type', 'application/json; charset=utf-8')

      // Send a single Chinese character by splitting its UTF-8 bytes into multiple sends.
      // A Chinese character occupies 3 bytes in UTF-8.
      const singleChar = '中'
      const buf = Buffer.from(singleChar)

      // Send one byte at a time
      buf.forEach((byte, index) => {
        setTimeout(() => {
          res.write(Buffer.from([byte]))
          if (index === buf.length - 1) {
            res.end()
          }
        }, index * 1)
      })
    }

    if (p === '/bom') {
      res.statusCode = 200
      res.setHeader('content-type', 'application/json; charset=utf-8')
      const bom = Buffer.from([0xef, 0xbb, 0xbf])
      const data = JSON.stringify({ text: 'hello' })
      res.write(Buffer.concat([bom, Buffer.from(data)]))
      res.end()
    }

    if (p === '/error/400') {
      res.statusCode = 400
      res.setHeader('Content-Type', 'text/plain')
      res.end()
    }

    if (p === '/error/500') {
      res.statusCode = 500
      res.setHeader('Content-Type', 'text/plain')
      res.end()
    }
  }
}
