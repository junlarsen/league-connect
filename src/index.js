const {exec} = require('child_process');
const fs = require('fs');
const ws = require('ws');
const fetch = require('node-fetch');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

class Connector {

    static async connect() {
        return new Promise((resolve, reject) => {
            const regex = process.platform === 'win32' ? /"--install-directory=(.*?)"/ : /--install-directory=(.*?)( --|\n|$)/;
            const cmd = process.platform === 'win32' ? "WMIC PROCESS WHERE name='LeagueClientUx.exe' GET CommandLine" : "ps x -o args | grep 'LeagueClientUx'";

            exec(cmd, (err, stdout) => {
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

    static async getWebSocket() {
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

    static async sendRequest(options, credentials) {
        return new Promise(async (resolve, reject) => {
                try {
                    const res = credentials || await Connector.connect();

                    const req = await fetch(`${res.protocol}://127.0.0.1:${res.port}/${options.url}`, {
                        method: options.method,
                        body: typeof options.body === "undefined" ? null : JSON.stringify(options.body),
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': 'Basic ' + Buffer.from(`riot:${res.token}`).toString('base64')
                        }
                    });

                    resolve(req);
                } catch
                    (err) {
                    reject(err);
                }
            }
        );
    }

}

module.exports = Connector;
