const { exec } = require('child_process');
const fs = require('fs');
const ws = require('ws');
const fetch = require('node-fetch');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

class Connector {

    static async connect() {
        return new Promise((resolve, reject) => {
            const regex = process.platform === 'win32' ? /"--install-directory=(.*?)"/ : /--install-directory=(.*?)( --|\n|$)/;

            exec("WMIC PROCESS WHERE name='LeagueClientUx.exe' GET CommandLine", (err, stdout) => {
                if (err) {
                    return reject(err);
                }

                const path = stdout.match(regex) || [];

                return fs.readFile(path[1] + 'lockfile', 'utf8', (err, data) => {
                    if (err) {
                        return reject("League Client was not found.");
                    }
                    
                    const [name, pid, port, token, protocol] = data.split(':');

                    resolve({
                        name,
                        pid: Number(pid),
                        port: Number(port),
                        token,
                        protocol
                    });
                });
            });
        });
    }

    static async getWebsocket() {
        return new Promise((resolve, reject) => {
            Connector.connect().then((res) => {
                const socket = new ws(`wss://riot:${res.token}@127.0.0.1:${res.port}`, {
                    headers: {
                        Authorization: 'Basic ' + Buffer.from(`riot:${res.token}`).toString('base64')
                    },
                    rejectUnauthorized: false
                });

                socket.on('open', () => {
                    socket.send(JSON.stringify([5, 'OnJsonApiEvent']));
                });

                resolve(socket);
            }).catch((err) => {
                reject(err);
            })
        });
    }

    static async sendRequest(options) {
        return new Promise((resolve, reject) => {
            Connector.connect().then((res) => {
                fetch(`${res.protocol}://127.0.0.1:${res.port}/${options.url}`, {
                    method: options.method,
                    body: options.bottom,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Basic ' + Buffer.from(`riot:${res.token}`).toString('base64')
                    }
                }).then((res) => {
                    resolve(res.json());
                }).catch(reject);
            }).catch(reject)
        });
    }

}

Connector.sendRequest({url: 'lol-summoner/v1/current-summoner', method: 'GET'}).then(console.log);

module.exports = Connector;
