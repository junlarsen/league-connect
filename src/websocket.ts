import WebSocket from 'ws'
import { auth, Credentials } from './index'

export async function connect(credentials: Credentials | null = null): Promise<WebSocket> {
  const creds = credentials || await auth()

  const socket = new WebSocket(`wss://riot:${creds.token}@127.0.0.1:${creds.port}`, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`riot:${creds.token}`).toString('base64')
    },
    rejectUnauthorized: false
  })

  socket.on('open', () => {
    socket.send(JSON.stringify([5, 'OnJsonApiEvent']))
  })

  return socket
}