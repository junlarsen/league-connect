import WebSocket, { ClientOptions } from 'ws'
import { EventResponse, Effect } from './index'
import { trimSlashes } from './utils'

/**
 * A wrapper class for a websocket connection to the league client
 */
export class LeagueWebSocket extends WebSocket {
  private subscriptions: Record<string, Array<Effect>> = {}

  /**
   * Create a new league client web socket
   *
   * @param address - The address/url the socket is located at
   * @param options - Any client options to the websocket
   */
  constructor(address: string, options: ClientOptions) {
    super(address, options)

    // Attach the LeagueWebSocket hook
    this.on('message', (s: string) => this.handle(s))
  }

  /**
   * Dispatch a subscription if it exists
   *
   * @internal
   */
  private handle(payload: string) {
    if (payload.length > 0) {
      const json = JSON.parse(payload)

      const [res]: [EventResponse] = json.slice(2)

      if (this.subscriptions[res.uri]?.length > 0) {
        this.subscriptions[res.uri].forEach((effect) => {
          effect(res.data, res)
        })
      }
    }
  }

  /**
   * Subscribe to an endpoint
   *
   * @param path - The websocket endpoint to subscribe to
   * @param effect - The callback to dispatch when the endpoint is emitted
   */
  public subscribe<T extends any = any>(path: string, effect: Effect<T>) {
    const p = trimSlashes(path)

    if (!this.subscriptions[p]) {
      this.subscriptions[p] = []
    }

    this.subscriptions[p].push(effect)
  }

  /**
   * Unsubscribe from an endpoint
   *
   * @remarks
   * Removes all listeners for the given path
   *
   * @param path = The path to unsubscribe from
   */
  public unsubscribe(path: string) {
    const p = trimSlashes(path)

    this.subscriptions[p] = []
  }

  /**
   * List all subscriptions
   *
   * @returns All the attached subscriptions
   */
  public getListeners(): Record<string, Array<Effect>> {
    return this.subscriptions
  }
}