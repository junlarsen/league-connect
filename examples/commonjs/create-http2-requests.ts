import { authenticate, createHttpSession, createHttp2Request } from 'league-connect'
import fs from 'fs'
import path from 'path'

async function mkdirp(dir: string) {
  if (fs.existsSync(dir)) {
    return true
  }
  const dirname = path.dirname(dir)
  mkdirp(dirname)
  return fs.mkdirSync(dir)
}

async function main() {
  const credentials = await authenticate()
  const session = await createHttpSession(credentials)

  const first = await createHttp2Request(
    {
      method: 'GET',
      url: '/lol-summoner/v1/current-summoner'
    },
    session,
    credentials
  )
  console.log(first.json())

  const second = await createHttp2Request(
    {
      method: 'GET',
      url: '/lol-summoner/v1/current-summoner/summoner-profile'
    },
    session,
    credentials
  )
  console.log(second.json())

  //  --------- IMAGE REQUEST ------------ //
  try {
    const imageReq = await createHttp2Request(
      {
        method: 'GET',
        url: '/lol-game-data/assets/v1/champion-icons/1.png'
      },
      session,
      credentials
    )
    mkdirp('champion-icons')
    const pathImg = 'champion-icons\\' + `${1}.png`
    fs.writeFileSync(pathImg, imageReq.buffer())
  } catch (e) {
    console.log('error')
    console.log(e)
  }

  session.close()
}

main()
