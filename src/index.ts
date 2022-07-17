export {
  authenticate,
  type AuthenticationOptions,
  type Credentials,
  ClientNotFoundError,
  InvalidPlatformError
} from './authentication.js'
export { LeagueClient, type LeagueClientOptions } from './client.js'
export { createHttp1Request, Http1Response } from './http.js'
export { createHttp2Request, createHttpSession, Http2Response } from './http2.js'
export {
  createWebSocketConnection,
  ConnectionOptions,
  LeagueWebSocket,
  EventResponse,
  EventCallback
} from './websocket.js'
export { DEPRECATED_request, DEPRECATED_RequestOptions, DEPRECATED_Response } from './request_deprecated.js'
export { DEPRECATED_connect } from './websocket_deprecated.js'
export type { HttpRequestOptions, HttpResponse, JsonObjectLike, HeaderPair } from './request_types.js'
