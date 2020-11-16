import { connect, EventResponse, LeagueWebSocket } from '../websocket'
import { authenticate } from '../authentication'

describe('connecting to the client websocket', () => {
  test('authenticating to the websocket', async (done) => {
    const credentials = await authenticate()
    const socket = await connect(credentials)

    expect(socket).toBeInstanceOf(LeagueWebSocket)
    expect(socket.subscriptions).toEqual(new Map())
    done()
  })

  test('an endpoint may be subscribed to multiple times', async (done) => {
    const credentials = await authenticate()
    const socket = await connect(credentials)

    expect(socket.subscriptions).toEqual(new Map())

    let count = 0
    socket.subscribe('/_test', () => count++)
    socket.subscribe('/_test', () => count++)

    expect(socket.subscriptions.size).toBe(1)
    expect(socket.subscriptions.get('/_test')).toHaveLength(2)

    // simulate emit
    socket.subscriptions.get('/_test')?.forEach(it => {
      it(null, {} as EventResponse)
    })

    expect(count).toBe(2)
    done()
  })
})