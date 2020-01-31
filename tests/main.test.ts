import { Response } from 'node-fetch'
import * as Connector from '../src'

describe('grabbing and using credentials', () => {
  describe('finding credentials', () => {
    test('tests grabbing credentials', async (done) => {
      const conn = await Connector.auth()

      expect(conn).not.toBeUndefined()

      done()
    })
  })

  describe('sending requests', () => {
    test('basic request does not result in a http error', async (done) => {
      const res = await Connector.request({
        method: 'POST',
        url: 'Help'
      })

      expect(res).toBeInstanceOf(Response)
      expect(res.ok).toEqual(true)

      done()
    })

    test('request with slash prefix also works', async (done) => {
      const res = await Connector.request({
        method: 'POST',
        url: '/Help'
      })

      expect(res).toBeInstanceOf(Response)
      expect(res.ok).toEqual(true)

      done()
    })
  })

  describe('using the websocket', () => {
    test('websocket also works when passing credentials', async (done) => {
      const ws = await Connector.connect()
      expect(ws).not.toBeUndefined()

      ws.on('open', () => {
        ws.close()
      })

      done()
    })

    test('websocket connects correctly without credentials', async (done) => {
      const conn = await Connector.auth()
      const ws = await Connector.connect(conn)

      expect(ws).toBeInstanceOf(Connector.LeagueWebSocket)

      ws.on('open', () => {
        ws.close()
      })

      done()
    })
  })

  describe('subscribing to the websocket', () => {
    test('subscription with slashes url works', async (done) => {
      const conn = await Connector.auth()
      const ws = await Connector.connect(conn)

      ws.on('open', () => {
        ws.subscribe('/lol-chat/v1/conversations/active', () => 0)

        expect(ws.getListeners()['/lol-chat/v1/conversations/active']).toHaveLength(1)

        ws.close()
      })

      done()
    })

    test('subscribing multiple times works as well', async (done) => {
      const conn = await Connector.auth()
      const ws = await Connector.connect(conn)

      ws.on('open', () => {
        ws.subscribe('/lol-chat/v1/conversations/active', () => 0)
        ws.subscribe('/lol-chat/v1/conversations/active', () => 0)
        ws.subscribe('/lol-chat/v1/conversations/active', () => 0)
        ws.subscribe('/lol-chat/v1/conversations/active', () => 0)

        expect(ws.getListeners()['/lol-chat/v1/conversations/active']).toHaveLength(4)

        ws.close()
      })

      done()
    })

    test('subscribing with non-slash prefixed path works', async (done) => {
      const conn = await Connector.auth()
      const ws = await Connector.connect(conn)

      ws.on('open', () => {
        ws.subscribe('lol-chat/v1/conversations/active', () => 0)

        expect(ws.getListeners()['/lol-chat/v1/conversations/active']).toHaveLength(1)

        ws.close()
      })

      done()
    })
  })
})
