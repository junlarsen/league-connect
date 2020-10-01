import { Credentials, Request } from '../shared/types.ts'
import { authenticate } from './authenticate.ts'
import { trimSlashes } from '../shared/utils.ts'

export async function request(
  options: Request,
  credentials: Credentials | undefined = undefined
): Promise<Response> {
  const _credentials = credentials || await authenticate()
  const uri = trimSlashes(options.url)
  const url = `${_credentials.protocol}://localhost:${_credentials.port}${uri}`
  const hasBody = typeof options.body === 'undefined'

  return fetch(url, {
    method: options.method,
    body: hasBody ? undefined : JSON.stringify(options.body),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`riot:${_credentials.token}`)
    }
  })
}