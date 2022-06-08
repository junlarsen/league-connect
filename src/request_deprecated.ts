import fetch, { Response as FetchResponse } from 'node-fetch'
import https from 'https'
import { Credentials } from './authentication'
import { trim } from './http'

export interface DEPRECATED_RequestOptions<T = any> {
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
 * Wrapper around Node-fetch Response which will deserialize JSON into the
 * proper type
 */
export class DEPRECATED_Response<T> extends FetchResponse {
  constructor(parent: FetchResponse) {
    super(parent.body, parent)
  }

  /**
   * Deserialize the response body into T
   */
  async json(): Promise<T> {
    const object = await super.json()

    return object as T
  }
}

export async function DEPRECATED_request<T = any, R = any>(
  options: DEPRECATED_RequestOptions<T>,
  credentials?: Credentials
): Promise<DEPRECATED_Response<R>> {
  const uri = trim(options.url)
  const url = `https://127.0.0.1:${credentials?.port}/${uri}`
  const hasBody = options.method !== 'GET' && options.body !== undefined

  const response = await fetch(url, {
    method: options.method,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`riot:${credentials?.password}`).toString('base64')
    },
    agent: new https.Agent(
      typeof credentials?.certificate === 'undefined'
        ? {
          rejectUnauthorized: false
        }
        : {
          ca: credentials?.certificate
        }
    )
  })

  return new DEPRECATED_Response<R>(response)
}
