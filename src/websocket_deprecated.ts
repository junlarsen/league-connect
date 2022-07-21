import https from 'https'
import { LeagueWebSocket } from './websocket.js'
import { Credentials } from './authentication.js'

export async function DEPRECATED_connect(credentials: Credentials): Promise<LeagueWebSocket> {
  const url = `wss://riot:${credentials.password}@127.0.0.1:${credentials.port}`

  return new LeagueWebSocket(url, {
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
}
