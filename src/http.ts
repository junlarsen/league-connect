import https from 'https'
import { IncomingMessage } from 'http'
import { Credentials } from './authentication'
import { TextEncoder } from 'util'
import assert from 'assert'

export type JsonObjectLike = Record<string, unknown>

export interface HttpRequestOptions<T = JsonObjectLike> {
  /**
   * Relative URL (relative to LCU API base url) to send api request to
   */
  url: string
  /**
   * Http verb to use for request
   */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /**
   * Optionally a body to pass to PUT/PATCH/POST/DELETE. This is typically
   * an object type as the library will parse this into JSON and send along
   * with the request
   */
  body?: T
}

/**
 * Mini-wrapper around http.IncomingMessage implementing common fields found in
 * fetch for easier transition from v5
 *
 * The previous implementation used fetch, so the fields ok, redirected, status
 * and statusText have been preserved.
 */
export class Response<T = JsonObjectLike> {
  public ok: boolean
  public redirected: boolean
  public status: number
  public statusText: string

  public constructor(public message: IncomingMessage, private raw: T) {
    assert(message.complete, 'Response constructor called with incomplete HttpIncomingMessage')
    // Safe assertion, this response originated from a http.ClientRequest
    const code = message!.statusCode!

    // See https://fetch.spec.whatwg.org/#statuses
    this.ok = code >= 200 && code < 300
    this.redirected = code === 301 || code === 302 || code === 303 || code === 307 || code === 308
    this.status = code
    this.statusText = message.statusMessage!
  }

  /** Convenience method kept for easy migration from v5 */
  json(): T {
    return this.raw
  }
}

export async function request<T = JsonObjectLike, R = JsonObjectLike>(
  options: HttpRequestOptions,
  credentials: Credentials
): Promise<Response<R>> {
  const agentOptions: https.AgentOptions =
    credentials.certificate === undefined ? { rejectUnauthorized: false } : { ca: credentials.certificate }

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        host: '127.0.0.1',
        port: credentials.port,
        path: '/' + trim(options.url),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + Buffer.from(`riot:${credentials.password}`).toString('base64')
        },
        agent: new https.Agent(agentOptions)
      },
      (response) => {
        let bodyText = ''
        response.setEncoding('utf8')
        response.on('data', (data) => void (bodyText += data))

        response.on('end', () => {
          try {
            const json = JSON.parse(bodyText)
            resolve(new Response(response, json))
          } catch (jsonError) {
            reject(jsonError)
          }
        })
      }
    )

    const data = JSON.stringify(options.body)
    const body = new TextEncoder().encode(data)
    request.on('error', (err) => reject(err))
    request.write(body)
    request.end()
  })
}

function trim(s: string): string {
  let r = s
  while (r.startsWith('/')) {
    r = r.substring(1)
  }
  return r
}
