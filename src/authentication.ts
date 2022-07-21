import fs from 'fs'
import cp from 'child_process'
import path from 'path'
import util from 'util'
import { fileURLToPath, URL } from 'url'

const exec = util.promisify<typeof cp.exec.__promisify__>(cp.exec)

const DEFAULT_NAME = 'LeagueClientUx'
const DEFAULT_POLL_INTERVAL = 2500

export interface Credentials {
  /**
   * The system port the LCU API is running on
   */
  port: number
  /**
   * The password for the LCU API
   */
  password: string
  /**
   * The system process id for the LeagueClientUx process
   */
  pid: number
  /**
   * Riot Games' self-signed root certificate (contents of .pem). If
   * it is `undefined` then unsafe authentication will be used.
   */
  certificate?: string
}

export interface AuthenticationOptions {
  /**
   * League Client process name. Set to RiotClientUx if you would like to
   * authenticate with the Riot Client
   *
   * Defaults: LeagueClientUx
   */
  name?: string
  /**
   * Does not return before the League Client has been detected. This means the
   * function stays unresolved until a League has been found.
   *
   * Defaults: false
   */
  awaitConnection?: boolean
  /**
   * The time duration in milliseconds between each attempt to locate a League
   * Client process. Has no effect if awaitConnection is false
   *
   * Default: 2500
   */
  pollInterval?: number
  /**
   * Riot Games' self-signed root certificate (contents of .pem)
   *
   * Default: version of certificate bundled in package
   */
  certificate?: string
  /**
   * Do not authenticate requests with Riot Games' self-signed root certificate
   *
   * Default: true if `certificate` is `undefined`
   */
  unsafe?: boolean
  /**
   * Use deprecated Windows WMIC command line over Get-CimInstance. Does nothing
   * if the system is not running on Windows. This is used to keep backwards
   * compatability with Windows 7 systems that don't have Get-CimInstance
   *
   * See https://github.com/matsjla/league-connect/pull/54
   * See https://github.com/matsjla/league-connect/pull/68
   *
   * Default: false
   */
  useDeprecatedWmic?: boolean
  /**
   * Set the Windows shell to use.
   *
   * Default: 'powershell'
   */
  windowsShell?: 'cmd' | 'powershell'
}

/**
 * Indicates that the application does not run on an environment that the
 * League Client supports. The Client runs on windows, linux or darwin.
 */
export class InvalidPlatformError extends Error {
  constructor() {
    super('process runs on platform client does not support')
  }
}

/**
 * Indicates that the league client could not be found
 */
export class ClientNotFoundError extends Error {
  constructor() {
    super('league client process could not be located')
  }
}

/**
 * Locates a League Client and retrieves the credentials for the LCU API
 * from the found process
 *
 * If options.awaitConnection is false the promise will resolve into a
 * rejection if a League Client is not running
 *
 * @param options {AuthenticationOptions} Authentication options, if any
 *
 * @throws InvalidPlatformError If the environment is not running
 * windows/linux/darwin
 */
export async function authenticate(options?: AuthenticationOptions): Promise<Credentials> {
  const __dirname = fileURLToPath(new URL('.', import.meta.url))
  const RIOT_GAMES_CERT = await fs.promises.readFile(path.join(__dirname, '..', 'riotgames.pem'), 'utf-8')

  async function tryAuthenticate() {
    const name = options?.name ?? DEFAULT_NAME
    const portRegex = /--app-port=([0-9]+)/
    const passwordRegex = /--remoting-auth-token=([\w-_]+)/
    const pidRegex = /--app-pid=([0-9]+)/
    const isWindows = process.platform === 'win32'

    let command: string
    if (!isWindows) {
      command = `ps x -o args | grep '${name}'`
    } else if (isWindows && options?.useDeprecatedWmic === true) {
      command = `wmic process where caption='${name}.exe' get commandline`
    } else {
      command = `Get-CimInstance -Query "SELECT * from Win32_Process WHERE name LIKE '${name}.exe'" | Select-Object CommandLine | fl`
    }

    const executionOptions = isWindows ? { shell: options?.windowsShell ?? ('powershell' as string) } : {}

    try {
      // See #59 and #60 for why we are replacing all whitespace in the raw output
      const { stdout: rawStdout } = await exec(command, executionOptions)
      // TODO: investigate regression with calling .replace on rawStdout
      const stdout = (rawStdout as any).replace(/\s/g, '')
      const [, port] = stdout.match(portRegex)!
      const [, password] = stdout.match(passwordRegex)!
      const [, pid] = stdout.match(pidRegex)!
      const unsafe = options?.unsafe === true
      const hasCert = options?.certificate !== undefined

      // See flow chart for this here: https://github.com/matsjla/league-connect/pull/44#issuecomment-790384881
      // If user specifies certificate, use it
      const certificate = hasCert
        ? options!.certificate
        : // Otherwise: does the user want unsafe requests?
        unsafe
        ? undefined
        : // Didn't specify, use our own certificate
          RIOT_GAMES_CERT

      return {
        port: Number(port),
        pid: Number(pid),
        password,
        certificate
      }
    } catch {
      throw new ClientNotFoundError()
    }
  }

  // Does not run windows/linux/darwin
  if (!['win32', 'linux', 'darwin'].includes(process.platform)) {
    throw new InvalidPlatformError()
  }

  if (options?.awaitConnection) {
    // Poll until a client is found, attempting to resolve every
    // `options.pollInterval` milliseconds
    return new Promise(function self(resolve, reject) {
      tryAuthenticate()
        .then((result) => {
          resolve(result)
        })
        .catch((_) => {
          setTimeout(self, options?.pollInterval ?? DEFAULT_POLL_INTERVAL, resolve, reject)
        })
    })
  } else {
    return tryAuthenticate()
  }
}
