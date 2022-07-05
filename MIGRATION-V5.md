# Migration from v5

LeagueConnect version 6 has changed a lot of the core APIs available, causing backwards incompatability which requires
us to bump the version to 6.

## Migrating from fetch to node http

v6 removes the external dependency of node-fetch, and makes use of node's own `http` and `http2` libraries. This means
the response type returned from the request methods have changed.

For backwards compatability, we have preserved `ok`, `status`, `redirected` fields and the `json()` method
on the `Http1Response` and `Http2Response` classes.

`request()` has been renamed and migrated to `createHttp1Request`, but the options are the same. Insted of returning an
augmented Fetch response, this function now returns a `Http1Response`.

If you do not wish to/don't have time to rewrite code to use 
createHttp1Request, you can access `DEPRECATED_request` until version 7.0.0

```ts
// previously
const credentials = await authenticate()
const response = await request({
  method: 'GET',
  url: '/lol-summoner/v1/current-summoner'
}, credentials)
const json = await response.json()

// now, using createHttp1Request
const credentials = await authenticate()
const response = await createHttp1Request({
  method: 'GET',
  url: '/lol-summoner/v1/current-summoner'
}, credentials)
const json = response.json() // notice the no await here
```

Accessing headers is now done through `response.message.headers` as this is a delegation to Node.js http headers.

## HTTP 2

Version 6 also features requests through HTTP/2.0. This is done with the `createHttp2Request` and `createHttpSession`
functions.

```ts
const credentials = await authenticate()
const session = createHttpSession(credentials)
const response = createHttp2Request({
  method: 'GET',
  url: '/lol-summoner/v1/current-summoner'
}, session, credentials)
// remember to always close the session
session.close()
```

## Automatic re-try attempts for WebSocket connection

The WebSocket `connect()` function has been replaced with the new `createWebSocketConnection` function which allows the
user to have the library re-try to connect to the WebSocket. This was done to resolve issue
https://github.com/matsjla/league-connect/issues/56

The connect function no longer requires the user to provide credentials, as this was unnecessary and reported in
https://github.com/matsjla/league-connect/issues/55. Instead, the user must pass in authentication options that the
`createWebSocketConnection` function will use to connnect (re-try connection with).

```ts
// previously
const credentials = await authenticate()
const ws = await connect(credentials)

ws.on('message', message => {
  // Subscribe to any websocket event
})

// now, with createWebSocketConnection
const ws = createWebSocketConnection({
  authenticationOptions: {}
})

ws.on('message', message => {
  // Subscribe to any websocket event
})
```
