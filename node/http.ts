import fetch, { Response } from 'node-fetch'
import https from "https"
import { authenticate } from './authenticate'
import { Request, Credentials } from './index'
import { trimSlashes } from './utils'

/**
 * Send a http request to an endpoint of the league client rest api
 *
 * @param options - The request options to pass to the endpoint
 * @param credentials - The credentials to authenticate with
 *
 * @returns The node-fetch response from the http request
 */
export async function request(
  options: Request,
  credentials?: Credentials | undefined
): Promise<Response> {
  const _credentials = credentials || await authenticate()
  const uri = trimSlashes(options.url)
  const url = `${_credentials.protocol}://127.0.0.1:${_credentials.port}${uri}`
  const hasBody = typeof options.body === "undefined"

  return fetch(url, {
    method: options.method,
    body: hasBody ? undefined : JSON.stringify(options.body),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(`riot:${_credentials.token}`)
        .toString('base64')
    },
    agent: new https.Agent({
      rejectUnauthorized: false
    })
  })
}