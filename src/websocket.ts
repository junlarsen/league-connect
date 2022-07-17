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

export interface ConnectionOptions {
  /**
   * Options that will be used to authenticate to the LCU WebSocket API
   */
  authenticationOptions: AuthenticationOptions

  /**
   * Polling interval in case connection fails.
   *
   * Default: 1000
   */
  pollInterval: number

  /** Internal, do not use, only used for testing. */
  __internalMockFaultyConnection?: number
  __internalMockCallback?: () => void
}

export async function createWebSocketConnection(options: ConnectionOptions): Promise<LeagueWebSocket> {
  const credentials = await authenticate(options.authenticationOptions)
  const url = `wss://riot:${credentials.password}@127.0.0.1:${credentials.port}`

  let __mockFaultyCounter = options.__internalMockFaultyConnection ?? 0

  let socket: LeagueWebSocket | null = null
  do {
    try {
      if (__mockFaultyCounter > 0) {
        __mockFaultyCounter--
        options?.__internalMockCallback?.()
        throw new Error('__mockFaultyCounter socket connection')
      }

      socket = new LeagueWebSocket(url, {
        headers: {
          Authorization: 'Basic ' + Buffer.from(`riot:${credentials.password}`).toString('base64')
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
    } catch (err) {
      await setTimeout(() => void 0, options.pollInterval ?? 1000)
    }
  } while (socket?.readyState !== LeagueWebSocket.OPEN && socket?.readyState !== LeagueWebSocket.CONNECTING)

  return socket
}
