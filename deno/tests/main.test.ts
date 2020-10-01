import { assert } from 'https://deno.land/std/testing/asserts.ts'
import { authenticate } from '../authenticate.ts'
import { request } from '../http.ts'

Deno.test("fetching the credentials from the lockfile", async () => {
  const credentials = await authenticate()

  assert(credentials !== undefined)
})

Deno.test("sending a basic request to the help endpoint", async () => {
  const res = await request({
    method: 'POST',
    url: 'Help'
  })
  await res.text()

  assert(res instanceof Response)
})

Deno.test("a path may have as many slashes in front as it wishes", async () => {
  const res = await request({
    method: 'POST',
    url: '/////////Help'
  })
  await res.text()

  assert(res instanceof Response)
})