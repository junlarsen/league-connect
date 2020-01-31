# LeagueConnect

LeagueConnect is a NodeJS module for connecting and consuming to the League Client APIs with an enhanced websocket experience.

## Installing

LeagueConnect is distributed via NPM.

```bash
npm i league-connect
yarn add league-connect
```

## Usage

LeagueConnect is split into three modules, authentication, requesting and websockets

**Retrieve the API credentials**

```typescript
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

**Send a Request to the API**

```typescript
import { auth, request } from 'league-connect'

const credentials = await auth()
const response = await request({
  url: '/lol-summoner/v1/current-summoner',
  method: 'GET',
  /* body: {} */
}, credentials)
```

**Connect to the WebSocket**

LeagueConnect wraps around the regular WebSocket object, providing subscribe and unsubscribe methods for endpoints.

```typescript
import { auth, connect } from 'league-connect'

const credentials = await auth()
const websocket = await connect(credentials)

// Use it like a regular websocket
websocket.on('message', data => {
  
})

// Subscribe to an endpoint
// You can subscribe multiple times to the same endpoint.
websocket.subscribe('/lol-chat/v1/conversations/active', (data, event) => {
  // data is the event payload, event contains the entire event
})

// Unsubscribe from path
websocket.unsubscribe('/lol-chat/v1/conversations/active')
```
