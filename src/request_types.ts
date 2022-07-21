export type HeaderPair = [string, string]
export type JsonObjectLike = Record<string, unknown>

export interface HttpResponse {
  readonly ok: boolean
  /** Was the request redirected at some point? */
  readonly redirected: boolean
  /** Http status code */
  readonly status: number

  /** Get the raw text response. */
  text(): string
  /** Attempt to parse the text response into json. Will throw if invalid json */
  json<T>(): string
  /** Http response headers */
  headers(): HeaderPair[]
}

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
