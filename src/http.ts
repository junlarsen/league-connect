import https from 'https'
import type { IncomingMessage } from 'http'
import { TextEncoder } from 'util'
import assert from 'assert'
import type { Credentials } from './authentication.js'
import type { HttpResponse, HeaderPair, HttpRequestOptions, JsonObjectLike } from './request_types.js'
import { trim } from './trim.js'

export class Http1Response implements HttpResponse {
  public readonly ok: boolean
  public readonly redirected: boolean
  public readonly status: number

  public constructor(private _message: IncomingMessage, private _raw: Buffer) {
    assert(_message.complete, 'Response constructor called with incomplete HttpIncomingMessage')
    // Safe assertion, this response originated from a http.ClientRequest
    const code = _message!.statusCode!

    // See https://fetch.spec.whatwg.org/#statuses
    this.ok = code >= 200 && code < 300
    this.redirected = [301, 302, 303, 307, 308].includes(code)
    this.status = code
  }

  public json<T = JsonObjectLike>() {
    return JSON.parse(this._raw.toString()) as T
  }

  public text(): string {
    return this._raw.toString()
  }

  public buffer(): Buffer {
    return this._raw
  }

  public headers(): HeaderPair[] {
    const headers: HeaderPair[] = []

    for (const [key, value] of Object.entries(this._message.headers)) {
      if (key.startsWith(':')) {
        continue
      }

      if (value === undefined) {
        headers.push([key, ''])
      } else if (Array.isArray(value)) {
        headers.push([key, value.join(', ')])
      } else {
        headers.push([key, value])
      }
    }

    return headers
  }
}

export async function createHttp1Request<T>(
  options: HttpRequestOptions<T>,
  credentials: Credentials
): Promise<Http1Response> {
  const agentOptions: https.AgentOptions =
    credentials.certificate === undefined ? { rejectUnauthorized: false } : { ca: credentials.certificate }

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        host: '127.0.0.1',
        port: credentials.port,
        path: '/' + trim(options.url),
        method: options.method,
        headers: {
          Accept: '*/*',
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + Buffer.from(`riot:${credentials.password}`).toString('base64')
        },
        agent: new https.Agent(agentOptions)
      },
      (response) => {
        let buffer: any = []
        response.on('data', (data) => void buffer.push(data))

        response.on('end', () => {
          try {
            resolve(new Http1Response(response, Buffer.concat(buffer)))
          } catch (jsonError) {
            reject(jsonError)
          }
        })
      }
    )
    if (options.body !== undefined) {
      const data = JSON.stringify(options.body)
      const body = new TextEncoder().encode(data)
      request.write(body, 'utf8')
    }

    request.on('error', (err) => reject(err))
    request.end()
  })
}
