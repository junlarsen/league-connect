# LeagueConnect

LeagueConnect is a basic module for connecting to the League Client APIs, heavily inspired by LCU-Connector by Pupix.

## Usage

Retrieve the credentials for the API:

```js
import { connect } from 'league-connect';

// Extracts the entire lockfile into an object.
const credentials = await connect();
```

Connect to the Client WebSocket:

```js
import { getWebSocket } from 'league-connect';

const ws = await getWebSocket();
```

Send a request to any API:

````js
import { connect, sendRequest } from 'league-connect';

const credentials = await connect();

// If you're sending anything with a body, use the body field.
const response = await sendRequest({
    url: 'lol-summoner/v1/current-summoner',
    method: 'GET'
    /* body: {} */
}, credentials);
```
