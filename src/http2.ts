import http2, { type IncomingHttpHeaders, type IncomingHttpStatusHeader } from 'http2'
import { TextEncoder } from 'util'
import assert from 'assert'
import { trim } from './trim.js'
import type { Credentials } from './authentication.js'
import type { HeaderPair, HttpResponse, HttpRequestOptions, JsonObjectLike } from './request_types.js'
import { RIOT_GAMES_CERT } from './cert.js'
import { Stream } from 'stream'

/**
 * Create a HTTP/2.0 client session.
 *
 * This invocation requires the credentials to have
 */
export async function createHttpSession(credentials: Credentials): Promise<http2.ClientHttp2Session> {
  const certificate = credentials.certificate ?? RIOT_GAMES_CERT

  return http2.connect(`https://127.0.0.1:${credentials.port}`, {
    ca: certificate
  })
}

export class Http2Response implements HttpResponse {
  public readonly ok: boolean
  public readonly redirected: boolean
  public readonly status: number

  public constructor(
    private _headers: IncomingHttpHeaders & IncomingHttpStatusHeader,
    private _stream: http2.ClientHttp2Stream,
    private _raw: Buffer
  ) {
    assert(_stream.closed, 'Response constructor called with unclosed ClientHttp2Stream')
    const code = _headers[':status']!

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

    for (const [key, value] of Object.entries(this._headers)) {
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

export async function createHttp2Request<T>(
  options: HttpRequestOptions<T>,
  session: http2.ClientHttp2Session,
  credentials: Credentials
): Promise<Http2Response> {
  assert(!session.closed, 'createHttp2Request called on closed session')
  const request = session.request({
    ':path': '/' + trim(options.url),
    ':method': options.method,
    Accept: '*/*',
    'Content-Type': 'application/json',
    Authorization: 'Basic ' + Buffer.from(`riot:${credentials.password}`).toString('base64')
  })
  if (options.body) {
    const data = JSON.stringify(options.body)
    const body = new TextEncoder().encode(data)
    request.write(body, 'utf8')
  }

  return new Promise((resolve, reject) => {
    let stream: any = []
    let headers: IncomingHttpHeaders & IncomingHttpStatusHeader
    request.on('response', (response) => {
      headers = response
    })
    request.on('data', (data) => {
      stream.push(data)
    })
    request.on('error', (err) => reject(err))
    request.on('end', () => {
      try {
        request.close()
        resolve(new Http2Response(headers, request, Buffer.concat(stream)))
      } catch (jsonError) {
        reject(jsonError)
      }
    })
  })
}
