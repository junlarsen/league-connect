# LeagueConnect

LeagueConnect is a basic module for connecting to the League Client APIs, heavily inspired by LCU-Connector by Pupix.

## Usage

Retrieve the credentials for the API:

```js
import Connector from 'league-connect';

// Extracts the entire lockfile into an object.
const credentials = await Connector.connect();
```

Connect to the Client WebSocket:

```js
import Connector from 'league-connect';

const ws = await Connector.getWebSocket();
```

Send a request to any API:

````js
import Connector from 'league-connect';

const credentials = await Connector.connect();

// If you're sending anything with a body, use the body field.
const response = await Connector.sendRequest({
    url: 'lol-summoner/v1/current-summoner',
    method: 'GET'
    /* body: {} */
}, credentials);
```
