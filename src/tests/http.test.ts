import { request } from '../http'
import { authenticate } from '../authentication'

describe('http', () => {
  test('sending basic http1.1 request', async () => {
    const credentials = await authenticate()
    const response = await request(
      {
        url: '/Help',
        method: 'GET'
      },
      credentials
    )

    expect(response.ok).toBeTruthy()
    expect(response.redirected).toBeFalsy()
    expect(response.status).toBe(200)
    expect(response.statusText).toBe('OK')
    expect(() => response.json()).not.toThrow()
  })

  test('sending data in get request is ignored by http', async () => {
    const credentials = await authenticate()
    const response = await request(
      {
        url: '/Help',
        method: 'GET',
        body: { hello: 'world' }
      },
      credentials
    )

    expect(response.ok).toBeTruthy()
  })
})
