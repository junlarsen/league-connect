import WebSocket from 'ws'
import { Response } from 'node-fetch'
import * as Connector from '../src'

describe('grabbing and using credentials', () => {
  test('tests grabbing credentials', async (done) => {
    const conn = await Connector.auth()

    expect(conn).not.toBeUndefined()

    done()
  })

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

    expect(ws).toBeInstanceOf(WebSocket)

    ws.on('open', () => {
      ws.close()
    })

    done()
  })

  test('basic request does not result in a http error', async (done) => {
    const res = await Connector.request({
      method: 'POST',
      url: 'Help'
    })

    expect(res).toBeInstanceOf(Response)
    expect(res.ok).toEqual(true)

    done()
  })
})
