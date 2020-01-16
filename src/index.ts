export { connect } from './websocket'
export { request } from './http'
export { auth } from './auth'

export interface Request {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any
}

export interface Credentials {
  name: string;
  pid: number;
  port: number;
  token: string;
  protocol: 'http' | 'https'
}
