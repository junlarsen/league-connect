import cp from 'child_process'
import util from 'util'

const exec = util.promisify(cp.exec)

export interface Credentials {
  /**
   * The system port the LCU API is running on
   */
  port: number
  /**
   * The password for the LCU API
   */
  password: string
}

export interface AuthenticationOptions {
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
  async function tryAuthenticate() {
    const portRegex = /--app-port=([0-9]+)/
    const passwordRegex = /--remoting-auth-token=([\w-_]+)/
    const command = process.platform === 'win32'
      ? 'WMIC PROCESS WHERE name=\'LeagueClientUx.exe\' GET CommandLine'
      : 'ps x -o args | grep \'LeagueClientUx\''

    try {
      const { stdout } = await exec(command)
      const [, port] = stdout.match(portRegex)!
      const [, password] = stdout.match(passwordRegex)!

      return {
        port: Number(port),
        password
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
      tryAuthenticate().then((result) => {
        resolve(result)
      }).catch((_) => {
        setTimeout(self, options?.pollInterval ?? 2500, resolve, reject)
      })
    })
  } else {
    return tryAuthenticate()
  }
}