import https from 'https'
import WebSocket, { ClientOptions } from 'ws'
import { authenticate, AuthenticationOptions } from './authentication.js'
import { trim } from './trim.js'

export interface EventResponse<T = any> {
  /**
   * The uri this event was dispatched at
   */
  uri: string
  /**
   * The data, if any
   */
  data: T
}

/**
 * Callback function for an subscription listener
 *
 * @param data The data payload (deserialized json)
 */
export type EventCallback<T = any> = (data: T | null, event: EventResponse<T>) => void

/**
 * WebSocket extension
 */
export class LeagueWebSocket extends WebSocket {
  subscriptions: Map<string, EventCallback[]> = new Map()

  constructor(address: string, options: ClientOptions) {
    super(address, options)

    // Subscribe to Json API
    this.on('open', () => {
      this.send(JSON.stringify([5, 'OnJsonApiEvent']))
    })

    // Attach the LeagueWebSocket subscription hook
    this.on('message', (content: string) => {
      // Attempt to parse into JSON and dispatch events
      try {
        const json = JSON.parse(content)
        const [res]: [EventResponse] = json.slice(2)

        if (this.subscriptions.has(res.uri)) {
          this.subscriptions.get(res.uri)?.forEach((cb) => {
            cb(res.data, res)
          })
        }
      } catch {}
    })
  }

  public subscribe<T extends any = any>(path: string, effect: EventCallback<T>) {
    const p = `/${trim(path)}`

    if (!this.subscriptions.has(p)) {
      this.subscriptions.set(p, [effect])
    } else {
      this.subscriptions.get(p)?.push(effect)
    }
  }

  public unsubscribe(path: string) {
    const p = `/${trim(path)}`

    this.subscriptions.delete(p)
  }
}

/**
 * Error thrown when the WebSocket initialization fails
 */
export class LeagueWebSocketInitError extends Error {
  public readonly errorEvent: WebSocket.ErrorEvent

  constructor(message: string, originalError: WebSocket.ErrorEvent) {
    super(message)
    this.errorEvent = originalError
  }
}

export interface ConnectionOptions {
  /**
   * Options that will be used to authenticate to the LCU WebSocket API
   */
  authenticationOptions?: AuthenticationOptions

  /**
   * Polling interval in case connection fails.
   *
   * Default: 1000
   */
  pollInterval?: number

  /**
   * Maximum number of retries to connect to the LCU WebSocket API.
   * If set to -1, it will retry indefinitely.
   * If set to 0, it will not retry.
   * Default: 10
   */
  maxRetries?: number

  /**
   * Current retry count. Used internally, please do not modify.
   * @internal
   */
  __internalRetryCount?: number

  /**
   * Callback function to be called when a mock faulty connection is made.
   * @internal
   */
  __internalMockCallback?: () => void
}

/**
 * Error codes for the WebSocket connection
 * @internal
 */
export enum ErrorCode {
  NoConnectionTryAgain,
  NoConnectionNoRetries,
  NoConnectionMaxRetries,
  OtherError
}

/**
 * Creates a WebSocket connection to the League Client
 *
 * @param {ConnectionOptions} [options] Options that will be used to authenticate to the League Client
 * @throws {LeagueWebSocketInitError} Thrown when the WebSocket initialization fails
 */
export async function createWebSocketConnection(options: ConnectionOptions = {}): Promise<LeagueWebSocket> {
  const credentials = await authenticate(options.authenticationOptions)
  const url = `wss://riot:${credentials.password}@127.0.0.1:${credentials.port}`

  return await new Promise((resolve, reject) => {
    const ws = new LeagueWebSocket(url, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`riot:${credentials.password}`).toString('base64')
      },
      // Use the certificate if it is provided, otherwise disable certificate verification
      agent: new https.Agent(
        credentials?.certificate ? { ca: credentials?.certificate } : { rejectUnauthorized: false }
      )
    })

    // Handle connection errors
    ws.onerror = async (err) => {
      ws.close()
      const response = await errorHandler(err, options)
      switch (response) {
        case ErrorCode.NoConnectionTryAgain:
          resolve(await createWebSocketConnection(options))
        case ErrorCode.NoConnectionNoRetries:
          reject(new LeagueWebSocketInitError('Could not connect to LCU WebSocket API', err))
        case ErrorCode.NoConnectionMaxRetries:
          reject(
            new LeagueWebSocketInitError(
              `Could not connect to LCU WebSocket API after ${options.__internalRetryCount} retries`,
              err
            )
          )
        default:
          reject(new LeagueWebSocketInitError(err.message, err))
      }
    }

    // Remove the error handler once the connection is established and resolve the promise
    ws.onopen = () => {
      ws.removeListener('error', errorHandler)
      resolve(ws)
    }
  })
}

/**
 * Handle errors that occur when connecting to the LCU WebSocket API
 *
 * @param {Websocket.ErrorEvent} err The error that occurred
 * @param {ConnectionOptions} options The options that were passed to the createWebSocketConnection function
 * @internal
 */
export async function errorHandler(err: WebSocket.ErrorEvent, options: ConnectionOptions = {}): Promise<ErrorCode> {
  // Set options to default values if they are not set
  options.__internalRetryCount === undefined ? (options.__internalRetryCount = 0) : options.__internalRetryCount++
  options.maxRetries = options.maxRetries ?? 10

  if (options.__internalMockCallback) options.__internalMockCallback()

  // Check if the error is a connection refused error. This is thrown when the LCU is starting but not completely ready yet.
  if (err.message.includes('ECONNREFUSED')) {
    // Check if the maximum number of retries has been reached and reject the promise if it has
    if (options.maxRetries === 0) return ErrorCode.NoConnectionNoRetries
    else if (options.maxRetries !== -1 && options.__internalRetryCount > options.maxRetries)
      return ErrorCode.NoConnectionMaxRetries
    else {
      // Wait for the poll interval and try again
      return new Promise((resolve) =>
        setTimeout(() => resolve(ErrorCode.NoConnectionTryAgain), options.pollInterval ?? 1000)
      )
    }
  }
  return ErrorCode.OtherError
}
