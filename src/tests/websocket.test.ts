import { EventEmitter } from 'events'

import { createWebSocketConnection, LeagueWebSocket, errorHandler, ErrorCode } from '../websocket'

// Make a mock websocket to test the error handler
class MockWebSocket extends EventEmitter {}
const __internalMockCallback = jest.fn()
const mockSocket = new MockWebSocket()
beforeEach(() => {
  __internalMockCallback.mockClear()
  mockSocket.removeAllListeners()
})

// Test(s) that require the League Client to be open
describe('connecting to the client websocket', () => {
  test('authenticating to the websocket', async () => {
    const socket = await createWebSocketConnection()
    expect(socket).toBeInstanceOf(LeagueWebSocket)
    expect(socket.subscriptions).toEqual(new Map())
    socket.close()
  })

  test('the error handler with the real websocket', async () => {
    const socket = await createWebSocketConnection()
    expect(socket).toBeInstanceOf(LeagueWebSocket)
    // We have to readd the listener because it's normally removed upon opening the socket
    socket.addEventListener('error', async (err) => {
      socket.close()
      const code = await errorHandler(err, { __internalMockCallback })
      expect(code).toEqual(ErrorCode.OtherError)
      expect(__internalMockCallback).toHaveBeenCalledTimes(1)
    })
    socket.emit('error', { message: 'Unknown' })
  })

  test('creating a websocket after multiple failed attempts', async () => {
    const options = { __internalRetryCount: 2, __internalMockCallback, maxRetries: 3, pollInterval: 500 }
    const socket = await createWebSocketConnection(options)
    expect(socket).toBeInstanceOf(LeagueWebSocket)
    expect(socket.subscriptions).toEqual(new Map())
    // Verify that the error handler was not called
    expect(__internalMockCallback).not.toHaveBeenCalled()
    socket.close()
  })
})

describe('testing the error handler', () => {
  test('handling ECONNREFUSED error no retries', async () => {
    mockSocket.on('error', async (errorEmited) => {
      const errorCode = await errorHandler(errorEmited, { maxRetries: 0, __internalMockCallback })
      expect(errorCode).toEqual(ErrorCode.NoConnectionNoRetries)
      expect(__internalMockCallback).toHaveBeenCalledTimes(1)
    })
    mockSocket.emit('error', { message: 'ECONNREFUSED' })
  })

  test('handling ECONNREFUSED error with retries', async () => {
    return new Promise<void>(async (resolve) => {
      const options = {
        maxRetries: 3,
        __internalMockCallback: jest.fn(),
        pollInterval: 500,
        __internalRetryCount: 0
      }

      mockSocket.on('error', async (errorEmited) => {
        const response = await errorHandler(errorEmited, options)
        if (options.__internalRetryCount <= options.maxRetries) {
          expect(response).toEqual(ErrorCode.NoConnectionTryAgain)
          expect(options.__internalMockCallback).toHaveBeenCalledTimes(options.__internalRetryCount)
          mockSocket.emit('error', { message: 'ECONNREFUSED' })
        } else {
          expect(response).toEqual(ErrorCode.NoConnectionMaxRetries)
          // maxRetries + 1 because the callback is called on initial try as well
          expect(options.__internalMockCallback).toHaveBeenCalledTimes(options.maxRetries + 1)
          resolve()
        }
      })

      mockSocket.emit('error', { message: 'ECONNREFUSED' })
    })
  }, 10000)

  test('handling an unknown error', async () => {
    mockSocket.on('error', async (errorEmited) => {
      const response = await errorHandler(errorEmited, { __internalMockCallback })
      expect(response).toEqual(ErrorCode.OtherError)
      expect(__internalMockCallback).toHaveBeenCalledTimes(1)
    })

    mockSocket.emit('error', { message: 'Unknown' })
  })
})
