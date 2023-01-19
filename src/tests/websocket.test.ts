import { createWebSocketConnection, LeagueWebSocket } from '../websocket'

// Test must be run with the League Client open
describe('connecting to the client websocket', () => {
  test('authenticating to the websocket', async () => {
    const socket = await createWebSocketConnection()
    expect(socket).toBeInstanceOf(LeagueWebSocket)
    expect(socket.subscriptions).toEqual(new Map())
    socket.close()
  })
  test('Handling ECONNREFUSED error no retries', async () => {
    const __internalMockCallback = jest.fn()
    const maxRetries = 0
    try {
      await createWebSocketConnection({
        __internalMockFaultyConnection: 'ECONNREFUSED',
        __internalMockCallback,
        maxRetries
      })
    } catch (e) {
      expect(e).toEqual(Error('Could not connect to LCU WebSocket API'))
    }
    expect(__internalMockCallback).toHaveBeenCalledTimes(1)
  })
  test('Handling ECONNREFUSED error with retries', async () => {
    // This test takes a while to run, so we need to increase the timeout
    jest.setTimeout(10000)
    const __internalMockCallback = jest.fn()
    const maxRetries = 3
    try {
      await createWebSocketConnection({
        __internalMockFaultyConnection: 'ECONNREFUSED',
        __internalMockCallback,
        maxRetries
      })
    } catch (e) {
      expect(e).toEqual(Error(`Could not connect to LCU WebSocket API after ${maxRetries} retries`))
    }
    expect(__internalMockCallback).toHaveBeenCalledTimes(maxRetries + 1)
  })
  test('Handling an unknown error', async () => {
    const __internalMockCallback = jest.fn()
    const maxRetries = 1
    try {
      await createWebSocketConnection({
        __internalMockFaultyConnection: 'Unknown',
        __internalMockCallback,
        maxRetries
      })
    } catch (e: any) {
      expect(e.message).toEqual('Unknown')
    }
  })
  test('EndTestOpen', async () => {
    const __internalMockCallback = jest.fn()
    const maxRetries = 1
    const ws = await createWebSocketConnection({
      __internalMockFaultyConnection: 'ECONNREFUSED - EndTestOpen',
      __internalMockCallback,
      maxRetries
    })
    expect(ws).toBeInstanceOf(LeagueWebSocket)
    expect(__internalMockCallback).toHaveBeenCalledTimes(maxRetries + 1)
    ws.close()
  })
})
