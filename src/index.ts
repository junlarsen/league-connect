export {
  authenticate,
  AuthenticationOptions,
  Credentials,
  ClientNotFoundError,
  InvalidPlatformError
} from './authentication'
export { LeagueClient, LeagueClientOptions } from './client'
export { createHttp1Request, Http1Response, AnyResponse, HttpRequestOptions } from './http'
export { createHttp2Request, createHttpSession, Http2Response } from './http2'
export {
  createWebSocketConnection,
  ConnectionOptions,
  LeagueWebSocket,
  EventResponse,
  EventCallback
} from './websocket'
export { DEPRECATED_request, DEPRECATED_RequestOptions, DEPRECATED_Response } from './request_deprecated'
export { DEPRECATED_connect } from './websocket_deprecated'
