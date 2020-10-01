import fs from 'fs-extra'
import cp from 'child_process'
import util from 'util'
import { Credentials } from './index'

const exec = util.promisify(cp.exec)

const winFlagsRe = /"--install-directory=(.*?)"/
const winCmd = 'WMIC PROCESS WHERE name=\'LeagueClientUx.exe\' GET CommandLine'

const unixFlagsRe = /--install-directory=(.*?)( --|\n|$)/
const unixCmd = 'ps x -o args | grep \'LeagueClientUx\''

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
  const re = process.platform === 'win32' ? winFlagsRe : unixFlagsRe
  const cmd = process.platform === 'win32' ? winCmd : unixCmd

  const { stdout } = await exec(cmd)
  const [, path] = stdout.match(re) || []

  try {
    const content = await fs.readFile(`${path}/lockfile`, 'utf8')
    const [name, pid, port, token, protocol] = content.split(':')

    return {
      pid: Number(pid),
      port: Number(port),
      protocol: protocol as 'http' | 'https',
      token,
      name
    }
  } catch {
    throw Error('League Client could not be located.')
  }
}