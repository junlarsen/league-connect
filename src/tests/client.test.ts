import { authenticate } from '../authentication'
import { LeagueClient } from '../client'

describe('league client adapter', () => {
  test('it does not fail on valid pid', async () => {
    const credentials = await authenticate()
    const client = new LeagueClient(credentials)

    client.start()
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        client.stop()
        resolve()
      }, 5000)
    })
  }, 10_000)

  // Manual test
  // TODO: automatic spawn/respawn of client
  test.skip('it detects connection loss/regain', async () => {
    const credentials = await authenticate()
    const client = new LeagueClient(credentials)

    client.start()
    client.on('connect', (creds) => {
      console.info('signal: connect')
      debugger
    })
    client.on('disconnect', () => {
      console.info('signal: disconnect')
      debugger
    })

    setTimeout(() => {
      client.stop()
    }, 300_000)
  }, 300_000)
})
