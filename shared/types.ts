/**
 * A basic http request to any LCU endpoint
 *
 * This type is used for sending http requests
 */
export interface Request {
  /**
   * The endpoint url to fetch from
   */
  url: string
  /**
   * The HTTP verb to use
   */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /**
   * A request body, if request is not GET
   */
  body?: any
}

/**
 * A set of credentials to authenticate with
 */
export interface Credentials {
  /**
   * The name of the league client process
   */
  name: string
  /**
   * The process PID of the league client
   */
  pid: number
  /**
   * The port the rest api is located at
   */
  port: number
  /**
   * The password to authenticate with
   */
  token: string
  /**
   * The http protocol to use
   */
  protocol: 'http' | 'https'
}

/**
 * A callback effect for a web socket subscription
 */
export type Effect<
  T = any,
  E extends EventResponse<T> = any> = (data: T | null, event: E) => void

/**
 * A basic response for a websocket event
 */
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

export const winFlagsRe = /"--install-directory=(.*?)"/
export const winCmd = 'WMIC PROCESS WHERE name=\'LeagueClientUx.exe\' GET CommandLine'

export const unixFlagsRe = /--install-directory=(.*?)( --|\n|$)/
export const unixCmd = 'ps x -o args | grep \'LeagueClientUx\''