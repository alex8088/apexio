<h1 align="center">apexio</h1>

<p align="center">Tiny HTTP client for Node.js</p>

<p align="center">
<img src="https://img.shields.io/npm/v/apexio?color=orange&label=version">
<img src="https://img.shields.io/github/license/alex8088/apexio?color=blue" alt="license" />
</p>

## Features

- 🚀 Lightweight and fast HTTP client for Node.js
- 💪 Full TypeScript support
- 🔥 Promise based
- ✨ Modern and intuitive API
- 🛡️ Automatic transforms for JSON data
- 🔌 Configurable request and response interceptors
- 📦 Zero dependencies

## Installation

```bash
$ npm install apexio
```

## Basic Usage

```typescript
import { Apexio } from 'apexio'

const apexio = new Apexio({
  baseURL: 'https://api.example.com'
})

// Make a GET request
apexio
  .get('/users')
  .then((response) => {
    console.log(response.data)
  })
  .catch((error) => {
    console.error(error)
  })

// Make a POST request with JSON data
apexio.post('/users', {
  name: 'John',
  email: 'john@example.com'
})
```

## API

### Request Methods

```typescript
apexio.get<T = any>(url: string, options?: ApexioRequestOptions): Promise<ApexioResponse<T>>
apexio.post<T = any>(url: string, data?: any, options?: ApexioRequestOptions): Promise<ApexioResponse<T>>
apexio.put<T = any>(url: string, data?: any, options?: ApexioRequestOptions): Promise<ApexioResponse<T>>
apexio.delete<T = any>(url: string, options?: ApexioRequestOptions): Promise<ApexioResponse<T>>
apexio.head<T = any>(url: string, options?: ApexioRequestOptions): Promise<ApexioResponse<T>>
apexio.options<T = any>(url: string, options?: ApexioRequestOptions): Promise<ApexioResponse<T>>
```

### Request Configuration

```typescript
{
  // Base URL for the request
  baseURL?: string

  // Request headers
  headers?: {
    [key: string]: string
  }

  // URL parameters to be appended to the URL
  params?: any

  // Request timeout in milliseconds
  timeout?: number

  // Response type: 'json' | 'text' | 'stream'
  responseType?: ApexioResponseType
}
```

### Response Structure

```typescript
{
  // Response data
  data: T

  // HTTP status code
  status: number

  // HTTP status message
  statusText: string

  // Response headers
  headers: IncomingHttpHeaders

  // Request configuration used
  config: ApexioRequestConfig
}
```

## Request Data Types

### JSON Data

```typescript
apexio.post('/api/users', {
  name: 'John',
  age: 30
})
```

### URL Search Params

```typescript
const params = new URLSearchParams()
params.append('name', 'John')
params.append('age', '30')

apexio.post('/api/users', params)
```

### Form Data

```typescript
import FormData from 'form-data'
import fs from 'node:fs'

const form = new FormData()
form.append('file', fs.createReadStream('path/to/file.txt'))
form.append('field', 'value')

apexio.post('/api/upload', form)
```

### Stream Data

```typescript
const stream = fs.createReadStream('path/to/file')
apexio.post('/api/upload', stream)
```

## Interceptors

```typescript
// Request interceptor
apexio.interceptors.request.use(
  (config) => {
    // Modify request config
    config.headers['Authorization'] = 'Bearer token'
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apexio.interceptors.response.use(
  (response) => {
    // Handle response data
    return response
  },
  (error) => {
    return Promise.reject(error)
  }
)
```

## Build

```sh
$ pnpm build
```

## Test

```sh
$ pnpm test
```

## License

[MIT](./LICENSE)
