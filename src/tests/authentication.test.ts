import { authenticate } from '../authentication'

describe('authenticating to the api', () => {
  test('locating the league client', async (done) => {
    const credentials = await authenticate()

    expect(credentials).not.toBeUndefined()
    done()
  })

  test('enabling polling until a client is found', async (done) => {
    const credentials = await authenticate({
      awaitConnection: true,
      pollInterval: 2500
    })

    expect(credentials).not.toBeUndefined()
    done()
  }, 300_000)
})
