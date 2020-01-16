import fs from 'fs-extra'
import cp from 'child_process'
import util from 'util'
import https from 'https'
import WebSocket from 'ws'
import fetch, { Response } from 'node-fetch'

const exec = util.promisify(cp.exec)

export interface Request {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any
}

export interface Credentials {
  name: string;
  pid: number;
  port: number;
  token: string;
  protocol: 'http' | 'https'
}

export async function connect(): Promise<Credentials> {
  const re = process.platform === 'win32' ? /"--install-directory=(.*?)"/ : /--install-directory=(.*?)( --|\n|$)/
  const cmd = process.platform === 'win32' ? "WMIC PROCESS WHERE name='LeagueClientUx.exe' GET CommandLine" : "ps x -o args | grep 'LeagueClientUx'"

  const { stdout } = await exec(cmd)
  const path = stdout.match(re) || []

  try {
    const content = await fs.readFile(`${path[1]}/lockfile`, 'utf8')

    const [name, pid, port, token, protocol] = content.split(':')

    return {
      name,
      pid: Number(pid),
      port: Number(port),
      token,
      protocol
    } as Credentials
  } catch (ex) {
    throw Error("League Client could not be located.")
  }
}

export async function getWebSocket(credentials: Credentials | null = null): Promise<WebSocket> {
  const auth = credentials || await connect()

  const socket = new WebSocket(`wss://riot:${auth.token}@127.0.0.1:${auth.port}`, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`riot:${auth.token}`).toString('base64')
    },
    rejectUnauthorized: false
  })

  socket.on('open', () => {
    socket.send(JSON.stringify([5, 'OnJsonApiEvent']))
  })

  return socket
}

export async function sendRequest(options: Request, credentials: Credentials | null = null): Promise<Response> {
  const auth = credentials || await connect()

  return fetch(`${auth.protocol}://127.0.0.1:${auth.port}/${options.url}`, {
    method: options.method,
    body: typeof options.body === "undefined" ? undefined : JSON.stringify(options.body),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(`riot:${auth.token}`).toString('base64')
    },
    agent: new https.Agent({
      rejectUnauthorized: false
    })
  })
}