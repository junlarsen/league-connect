import { createHttpSession, createHttp2Request } from '../http2'
import { authenticate } from '../authentication'

describe('http2', () => {
  test('sending basic http2.2 request', async () => {
    const credentials = await authenticate()
    const session = await createHttpSession(credentials)
    const response = await createHttp2Request(
      {
        url: '/Help',
        method: 'GET'
      },
      session,
      credentials
    )

    expect(response.ok).toBeTruthy()
    expect(response.redirected).toBeFalsy()
    expect(response.status).toBe(200)
    expect(() => response.json()).not.toThrow()

    expect(session.closed).toBeFalsy()
    session.close()
  })

  test('sending two requests during the same session', async () => {
    const credentials = await authenticate()
    const session = await createHttpSession(credentials)
    const r1 = await createHttp2Request(
      {
        url: '/Help',
        method: 'GET'
      },
      session,
      credentials
    )

    const r2 = await createHttp2Request(
      {
        url: '/Help',
        method: 'GET'
      },
      session,
      credentials
    )

    expect(r1.ok).toBeTruthy()
    expect(r2.ok).toBeTruthy()
    expect(session.closed).toBeFalsy()
    session.close()
  })

  test('sending through closed session is a failure', async () => {
    const credentials = await authenticate()
    const session = await createHttpSession(credentials)
    session.close()
    await expect(
      createHttp2Request(
        {
          url: '/Help',
          method: 'GET'
        },
        session,
        credentials
      )
    ).rejects.toThrow()
  })
})
