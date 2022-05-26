import { createWebSocketConnection, LeagueWebSocket } from '../websocket'

describe('connecting to the client websocket', () => {
  test('authenticating to the websocket', async () => {
    const socket = await createWebSocketConnection({
      authenticationOptions: {},
      pollInterval: 2500
    })

    expect(socket).toBeInstanceOf(LeagueWebSocket)
    expect(socket.subscriptions).toEqual(new Map())
  })

  test('it will try to connect multiple times', async () => {
    const fn = jest.fn()
    const socket = await createWebSocketConnection({
      authenticationOptions: {},
      pollInterval: 500,
      __internalMockFaultyConnection: 3,
      __internalMockCallback: fn
    })

    expect(socket).toBeInstanceOf(LeagueWebSocket)
    expect(fn).toBeCalledTimes(3)
  })
})
