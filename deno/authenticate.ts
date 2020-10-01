import { exec, OutputMode } from 'https://deno.land/x/exec@0.0.5/mod.ts'
import {
  Credentials,
  unixCmd,
  unixFlagsRe,
  winCmd,
  winFlagsRe
} from '../shared/types.ts'

/**
 * Get the credentials for the league client
 *
 * @remarks
 * This locates a running league client and pulls the credentials to the League
 * Client APIs through the lockfile.
 *
 * If no league process could be found, an Error is thrown.
 *
 * @returns The credentials located in the lockfile
 */
export async function authenticate(): Promise<Credentials> {
  const { os } = Deno.build

  const re = os === 'windows' ? winFlagsRe : unixFlagsRe
  const cmd = os === 'windows' ? winCmd : unixCmd

  const { output } = await exec(cmd, { output: OutputMode.Capture })
  const [, path] = output.match(re) || []

  const file = `${path}/lockfile`
  const stat = await Deno.stat(file)

  if (!stat.isFile) {
    throw new Error('League Client could not be located')
  }

  const content = await Deno.readTextFile(`${path}/lockfile`)
  const [name, pid, port, token, protocol] = content.split(':')

  return {
    pid: Number(pid),
    port: Number(port),
    protocol: protocol as 'http' | 'https',
    token,
    name
  }
}