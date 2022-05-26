import http2, { IncomingHttpHeaders, IncomingHttpStatusHeader } from 'http2'
import { HttpRequestOptions, trim, JsonObjectLike, AnyResponse } from './http'
import { Credentials } from './authentication'
import fs from 'fs'
import path from 'path'
import { TextEncoder } from 'util'
import assert from 'assert'

/**
 * Create a HTTP/2.0 client session.
 *
 * This invocation requires the credentials to have
 */
export async function createHttpSession(credentials: Credentials): Promise<http2.ClientHttp2Session> {
  const RIOT_GAMES_CERT = await fs.promises.readFile(path.join(__dirname, '..', 'riotgames.pem'), 'utf-8')
  const certificate = credentials.certificate ?? RIOT_GAMES_CERT

  return http2.connect(`https://127.0.0.1:${credentials.port}`, {
    ca: certificate
  })
}

export class Http2Response<T = JsonObjectLike> implements AnyResponse<T> {
  public ok: boolean
  public redirected: boolean
  public status: number

  public constructor(
    public headers: IncomingHttpHeaders & IncomingHttpStatusHeader,
    stream: http2.ClientHttp2Stream,
    private raw: T
  ) {
    assert(stream.closed, 'Response constructor called with unclosed ClientHttp2Stream')
    const code = headers[':status']!

    this.ok = code >= 200 && code < 300
    this.redirected = code === 301 || code === 302 || code === 303 || code === 307 || code === 308
    this.status = code
  }

  json(): T {
    return this.raw
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
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: 'Basic ' + Buffer.from(`riot:${credentials.password}`).toString('base64')
  })
  request.setEncoding('utf8')
  if (options.body) {
    const data = JSON.stringify(options.body)
    const body = new TextEncoder().encode(data)
    request.write(body, 'utf8')
  }

  return new Promise((resolve, reject) => {
    let bodyText = ''
    let headers: IncomingHttpHeaders & IncomingHttpStatusHeader
    request.on('response', (response) => {
      headers = response
    })
    request.on('data', (data) => void (bodyText += data))
    request.on('error', (err) => reject(err))
    request.on('end', () => {
      try {
        const json = JSON.parse(bodyText)
        request.close()
        resolve(new Http2Response(headers, request, json))
      } catch (jsonError) {
        reject(jsonError)
      }
    })
  })
}
