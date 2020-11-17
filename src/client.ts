import { EventEmitter } from 'events'
import {
  authenticate,
  ClientNotFoundError,
  Credentials
} from './authentication'

export declare interface LeagueClient {
  on(event: 'connect', callback: (credentials: Credentials) => void): this
  on(event: 'disconnect', callback: () => void): this
}

export interface LeagueClientOptions {
  /**
   * The time duration in milliseconds between each check for a client
   * disconnect
   *
   * Default: 2500
   */
  pollInterval: number
}

export class LeagueClient extends EventEmitter {
  private isListening: boolean = false
  public credentials?: Credentials = undefined

  constructor(credentials: Credentials, public options?: LeagueClientOptions) {
    super();
    this.credentials = credentials
  }

  /**
   * Start listening for League Client processes
   */
  start() {
    // Only trigger if it's not already
    // running
    if (!this.isListening) {
      this.isListening = true

      if (this.credentials === undefined || !processExists(this.credentials.pid)) {
        // Invalidated credentials or no LeagueClientUx process, fail
        throw new ClientNotFoundError()
      }

      this.onTick()
    }
  }

  /**
   * Stop listening for client stop/start
   */
  stop() {
    this.isListening = false
  }

  private async onTick() {
    if (this.isListening) {
      if (this.credentials !== undefined) {
        // Current credentials are valid
        if (!processExists(this.credentials.pid)) {
          // No such process, emit disconnect and
          // invalidate credentials
          this.emit('disconnect')
          this.credentials = undefined
          // Re-queue onTick to listen for credentials
          this.onTick()
        } else {
          // Process still lives, queue onTick
          setTimeout(() => {
            this.onTick()
          }, this.options?.pollInterval ?? 2500)
        }
      } else {
        // Current credentials were invalidated, wait for
        // client to come back up
        const credentials = await authenticate({
          awaitConnection: true,
          pollInterval: this.options?.pollInterval ?? 2500
        })
        this.credentials = credentials
        this.emit('connect', credentials)
      }
    }
  }
}

function processExists(pid: number): boolean {
  try {
    // `man 1 kill`: if sig is 0, then no signal is sent, but error checking
    // is still performed.
    return process.kill(pid, 0)
  } catch(err) {
    return err.code === 'EPERM'
  }
}