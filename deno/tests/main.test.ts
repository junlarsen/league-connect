import { assert } from 'https://deno.land/std/testing/asserts.ts'
import { authenticate } from '../authenticate.ts'

Deno.test("finding credentials", async () => {
  const credentials = await authenticate()

  assert(credentials !== undefined)
})