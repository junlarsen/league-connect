---
id: api
title: API Reference
sidebar_label: API Reference
---

This page contains all the public methods LeagueConnect exposes and describes how to use them with examples.

## Authentication

```ts
async function auth(): Promise<Credentials>
```

This function reads the League Client credentials from the generated lockfile.

```ts
import { auth } from 'league-connect'

const credentials = await auth()
// {
//   name: "LeagueClient",
//   pid: 22976,
//   port: 60432
//   token: "50RB_U6QTOc7VryhdRUMzA"
//   protocol: "https"
// }
```

## Request

```ts
async function request(options: Request, credentials?: Credentials | undefined): Promise<Response>
```

This function sends a request to the League Client API. If no credentials are passed, the function will call `auth` on its own to retrieve the credentials.

```ts
import { auth, request } from 'league-connect'

const credentials = await auth()
const response = await request({
  url: '/lol-summoner/v1/current-summoner',
  method: 'GET'
}, credentials)
```

## WebSocket

```ts
async function connect(credentials: Credentials | undefined = undefined): Promise<LeagueWebSocket>
```

Access the API websocket. If no credentials are passed, the function will call `auth` on its own to retrieve the credentials.

This function returns a `LeagueWebSocket`, which is an extended websocket which supports listening to certain endpoints. (Documentation below)

```ts
import { auth, connect } from 'league-connect'

const credentials = await auth()
const websocket = await connect(credentials)
```

Because this is an extended websocket you will still be able to listen to events like you usually would.

```ts
websocket.on('message', data => {
  console.log("I received a message!")
})
```

## Attaching a subscription

```ts
type Effect <T = any, E extends EventResponse = any> = (data: T | null, event: E) => void
function LeagueWebSocket.subscribe<T extends any = any>(path: string, effect: Effect<T>)
```

LeagueConnect allows you to subscribe to certain API endpoints. It receives a callback which contains the JSON payload and the event.

```ts
websocket.subscribe('/lol-chat/v1/conversations/active', (data, event) => {
  console.log("An event from /lol-chat/v1/conversations/active was just received!")
})
```

## Unsubscribe

```ts
function LeagueWebSocket.unsubscribe(path: string)
```

You can unsubscribe from an event at any time. Simply call `unsubscribe` with the path you want to stop watching.

```ts
websocket.unsubscribe('/lol-chat/v1/conversations/active')
```
