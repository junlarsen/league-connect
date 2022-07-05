import { DEPRECATED_request } from '../request_deprecated'
import { authenticate } from '../authentication'

describe('sending requests to the api', () => {
  test('authenticating to the api', async () => {
    const credentials = await authenticate()
    const res = await DEPRECATED_request(
      {
        method: 'GET',
        url: '/Help'
      },
      credentials
    )

    expect(res.ok).toEqual(true)
    expect(res.status).toEqual(200)
  })
})
