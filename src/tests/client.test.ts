import { authenticate } from '../authentication'
import { LeagueClient } from '../client'

describe('league client adapter', () => {
  test('it does not fail on valid pid', async (done) => {
    const credentials = await authenticate()
    const client = new LeagueClient(credentials)

    client.start()
    setTimeout(() => {
      client.stop()
      done()
    }, 5000)
  }, 10_000)

  // Manual test
  // TODO: automatic spawn/respawn of client
  test('it detects connection loss/regain', async (done) => {
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
      done()
    }, 300_000)
  }, 300_000)
})