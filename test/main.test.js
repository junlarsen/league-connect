const ava = require('ava')
const WebSocket = require('ws')
const fetch = require('node-fetch')
const Connector = require('../dist/index')

ava('test grabbing credentials', async (test) => {
    const credentials = await Connector.connect()

    test.assert(credentials !== undefined)
})

ava('test that websocket connects correctly without passed creds', async (test) => {
    const ws = await Connector.getWebSocket()

    test.assert(ws instanceof WebSocket)
})

ava('test that websocket also works when passing credentials', async (test) => {
    const credentials = await Connector.connect()
    const ws = await Connector.getWebSocket(credentials)

    test.assert(ws instanceof WebSocket)
})

ava('test that a basic request does not result in a http error', async (test) => {
    const res = await Connector.sendRequest({
        method: 'POST',
        url: 'Help'
    })

    test.assert(res instanceof fetch.Response)
    test.assert(res.ok)
})
