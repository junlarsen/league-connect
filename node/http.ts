import fetch, { Response } from 'node-fetch'
import https from "https"
import { auth } from './auth'
import { Request, Credentials } from './index'
import { trimSlashes } from './utils'

export async function request(options: Request, credentials?: Credentials | undefined): Promise<Response> {
  const creds = credentials || await auth()
  const url = trimSlashes(options.url)

  return fetch(`${creds.protocol}://127.0.0.1:${creds.port}${url}`, {
    method: options.method,
    body: typeof options.body === "undefined" ? undefined : JSON.stringify(options.body),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(`riot:${creds.token}`).toString('base64')
    },
    agent: new https.Agent({
      rejectUnauthorized: false
    })
  })
}