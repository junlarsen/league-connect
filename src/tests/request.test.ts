import { request } from '../request'
import { authenticate } from '../authentication'

describe('sending requests to the api', () => {
  test('authenticating to the api', async (done) => {
    const credentials = await authenticate()
    const res = await request({
      method: 'GET',
      url: '/Help'
    }, credentials)

    expect(res.ok).toEqual(true)
    expect(res.status).toEqual(200)
    done()
  })
})