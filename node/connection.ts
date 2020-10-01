import { authenticate, Credentials } from './index'
import { LeagueWebSocket } from './index'

/**
 * Connect to the web socket
 *
 * @remarks
 * Connect to the League Client APIs websocket and wrap it into a
 * {LeagueWebSocket}
 *
 * @param credentials - The credentials to authenticate with
 *
 * @returns The websocket connection to the league client
 */
export async function connect(
  credentials: Credentials | undefined = undefined
): Promise<LeagueWebSocket> {
  const _credentials = credentials || await authenticate()
  const url = `wss://riot:${_credentials.token}@127.0.0.1:${_credentials.port}`

  const socket = new LeagueWebSocket(url, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`riot:${_credentials.token}`)
        .toString('base64')
    },
    rejectUnauthorized: false
  })

  socket.on('open', () => {
    socket.send(JSON.stringify([5, 'OnJsonApiEvent']))
  })

  return socket
}