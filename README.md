<br />
<p align="center">
  <h3 align="center">League Connect</h3>

  <p align="center">
    Module for consume the League of Legends Client APIs
    <br />
    <a href="https://github.com/matsjla/league-connect/issues">Report Bug</a>
    |
    <a href="https://github.com/matsjla/league-connect/issues">Request Feature</a>
  </p>
</p>

## Table of Contents

* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Usage](#usage)
* [License](#license)

## Getting Started

League Connect is a NodeJs module for consuming the League of Legends Client APIs

- [Official League Client API Documentation][1]
- [Unofficial League Client API Documentation (HextechDocs)][2]

**If you're migrating from v5, please check out the [migration guide](./MIGRATION-V5.md)**

### Prerequisites

To start using League Connect, ensure the following packages are installed:

- Node (any recent version should run ([download][3]))
- Yarn or NPM
- League of Legends ([download][4])

You should also check out the [examples](examples) directory for code examples.

### Installation

League Connect ships as an NPM module, installable through Yarn or NPM. To add the 
package to your project, install it through your package manager of choice.

```sh
$ yarn add league-connect
# Or ...
$ npm install league-connect
```

## Usage

League Connect ships 4 primary APIs:

- [`authenticate`: Fetch credentials to the Client APIs](#authenticate)
- [`createHttp1/2Request`: Send HTTP requests to Client API endpoints](#requests)
- [`LeagueClient`: Listen for League Client shutdown/startups](#leagueclient)

### Authenticate

Credentials are passed around as an object containing a port and a password [(see source)][credentials].
These credentials are pulled from the LeagueClientUx process and will be used to authenticate any
requests or connections to the APIs.

**Code Example**

```js
import { authenticate } from 'league-connect'

const credentials = await authenticate()
console.log(credentials) // { password: '37dn2gsxH3ns', port: 37241 }
```

By default, the `authenticate` function will return a rejected promise if it failed to locate a running
LeagueClientUx process. If you wish to await until a client is found, you can use the optional options:

| Option | Default Value | Description |
|--------|---------------|-------------|
| name | `LeagueClientUx` | League Client name, set to RiotClientUx if you would like to authenticate with the Riot Client
| awaitConnection | `false` | Await until a LeagueClientUx process is found |
| pollInterval | `2500` | Duration in milliseconds between each poll. No-op if awaitConnection is false. |
| certificate | `undefined` | A plain-text self-signed certificate to authenticate to the LCU API with. This option should only be used if you're self-signing with a certificate which is not the one Riot Games provides on their developer page. League Connect will default to using Riot's own self-signed certificate for authentication. If you're of what this option does, you should probably not use it. |
| unsafe | `false` | If you do not wish to authenticate safely using a self-signed certificate you can authorize while ignoring any certificate rejections. To authenticate this way, set unsafe to `true`. The custom certificate option will take precedence over this, meaning this option is meaningless if a custom certificate is provided. |
| useDeprecatedWmic | `false` | Use deprecated Windows WMIC command line over Get-CimInstance. Does nothing if the system is not running on Windows. |
| windowsShell | `powershell` | Set the Windows shell to use. Either powershell or cmd. |

```js
import { authenticate } from 'league-connect'

const credentials = await authenticate({
  awaitConnection: true,
  pollInterval: 5000,
  // certificate: "-----BEGIN CERTIFICATE-----\nSowhdnAMyCertificate\n-----ENDCERTIFICATE-----",
  // unsafe: true
})
```

###### [See source for available options][credentials]

### Connect

The League Client runs a WebSocket for an event bus which anything using the client may connect to. Developers
may also connect to this socket over wss. LeagueConnect provides a function to retrieve a WebSocket connection.

```js
import { createWebSocketConnection } from 'league-connect'

const ws = await createWebSocketConnection({
  authenticationOptions: {} // any options that can also be called to authenticate()
})
```

League Connect uses its own extended WebSocket class which allows subscriptions to certain API endpoints.

The socket instance automatically subscribes to Json events from the API which will be ran on the `message` event.

**Code Example**

```js
import { createWebSocketConnection } from 'league-connect'

const ws = await createWebSocketConnection({
  authenticationOptions: {}
})

ws.on('message', message => {
  // Subscribe to any websocket event
})
```

```js
import { createWebSocketConnection } from 'league-connect'

const ws = await createWebSocketConnection(credentials)

ws.subscribe('/lol-chat/v1/conversations/active', (data, event) => {
  // data: deseralized json object from the event payload
  // event: the entire event (see EventResponse<T>)
})
```

###### [See source for LeagueWebSocket][websocket]

### Requests

LeagueConnect supports both HTTP/1.1 and HTTP/2.0. Use the corresponding APIs as necessary.

LeagueConnect supports sending HTTP requests to any of the League Client API endpoints
(endpoints can be discovered and viewed with [rift-explorer][riftexplorer])

If you're looking to use HTTP/2.0, you first need to create a session.

```js
import { authenticate, createHttpSession, createHttp2Request } from 'league-connect'

const credentials = await authenticate()
const session = await createHttpSession(credentials)
const response = await createHttp2Request({
  method: 'GET',
  url: '/lol-summoner/v1/current-summoner'
}, session, credentials)

// Remember to close the session when done
session.close()
```

For HTTP/1.0, you can simply use the `createHttp1Request` function.

```js
import { authenticate, createHttp1Request } from 'league-connect'

const credentials = await authenticate()
const response = await createHttp1Request({
  method: 'GET',
  url: '/lol-summoner/v1/current-summoner'
}, credentials)
```

Both `createHttp1Request` and `createHttp2Request` take the same options.

| Option | Description |
|--------|-------------|
| url | Relative URI to send the http request to |
| method | HTTP verb to use |
| body | Optional post body (for non GET requests) as object literal. (library serializes it) |

###### [See source for available options][request]

### LeagueClient

The LeagueClient class is an EventEmitter which will listen for the LeagueClientUx process, 
reporting shutdown/startup of the application. The emitter has two listeners: `connect` and
`disconnect`.

**Code Example**

```js
import { authenticate, LeagueClient } from 'league-connect'

const credentials = await authenticate()
const client = new LeagueClient(credentials)

client.on('connect', (newCredentials) => {
  // newCredentials: Each time the Client is started, new credentials are made
  // this variable contains the new credentials.
})

client.on('disconnect', () => {

})

client.start() // Start listening for process updates
client.stop()  // Stop listening for process updates
```

By default, the LeagueClient class will check for a client connection/disconnection
every 2.5 seconds. This can be changed by passing an options object into the
constructor.

| Option | Default Value | Description |
|--------|---------------|-------------|
| pollInterval | `2500` | Duration in milliseconds between process existence check |

```js
import { authenticate, LeagueClient } from 'league-connect'

const credentials = await authenticate()
const client = new LeagueClient(credentials, {
  pollInterval: 1000 // Check every second
})
```

######  [See source for available options][leagueclient]

## License

Distributed under the MIT License. See `LICENSE` for more information.

[1]: https://developer.riotgames.com/docs/lol#league-client-api
[2]: https://www.hextechdocs.dev/lol/lcuapi
[3]: https://nodejs.org/en/download/
[4]: https://signup.na.leagueoflegends.com/en/signup/redownload

[credentials]: https://github.com/matsjla/league-connect/blob/master/src/authentication.ts
[websocket]: https://github.com/matsjla/league-connect/blob/master/src/websocket.ts
[riftexplorer]: https://github.com/Pupix/rift-explorer
[request]: https://github.com/matsjla/league-connect/blob/master/src/http.ts
[leagueclient]: https://github.com/matsjla/league-connect/blob/master/src/client.ts
