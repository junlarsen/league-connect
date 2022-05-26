import { authenticate, createHttpSession, createHttp2Request } from 'league-connect'

async function main() {
  const credentials = await authenticate()
  const session = await createHttpSession(credentials)

  const first = await createHttp2Request({
    method: 'GET',
    url: '/lol-summoner/v1/current-summoner'
  }, session, credentials)
  console.log(first.json())

  const second = await createHttp2Request({
    method: 'GET',
    url: '/lol-summoner/v1/current-summoner/summoner-profile'
  }, session, credentials)
  console.log(second.json())

  session.close()
}

main()
