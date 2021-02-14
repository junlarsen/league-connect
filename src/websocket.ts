import WebSocket, { ClientOptions } from 'ws'
import { Credentials } from './authentication'

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

export async function connect(credentials: Credentials): Promise<LeagueWebSocket> {
  const url = `wss://riot:${credentials.password}@127.0.0.1:${credentials.port}`

  return new LeagueWebSocket(url, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`riot:${credentials.password}`).toString('base64')
    },
    rejectUnauthorized: false
  })
}

/**
 * Trim slashes in front of a string
 * @param s
 */
function trim(s: string): string {
  let r = s
  while (r.startsWith('/')) {
    r = r.substr(1)
  }
  return r
}
