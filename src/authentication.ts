import { exec as nodeExec } from 'child_process'
import { promisify } from 'util'
import { RIOT_GAMES_CERT } from './cert.js'

const exec = promisify(nodeExec)

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
  /**
   * Debug mode. Prints error information to console.
   * @internal
   */
  __internalDebug?: boolean
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
 * Indicates that the League Client could not be found
 */
export class ClientNotFoundError extends Error {
  constructor() {
    super('League Client process could not be located')
  }
}

/**
 * Indicates that the League Client is running as administrator and the current script is not
 */
export class ClientElevatedPermsError extends Error {
  constructor() {
    super('League Client has been detected but is running as administrator')
  }
}

/**
 * Indicates that the League Client process arguments could not be parsed
 */
export class ProcessArgsParsingError extends Error {
  public readonly rawStdout: string | undefined
  public readonly port: string | undefined
  public readonly password: string | undefined
  public readonly pid: string | undefined

  constructor(rawStdout?: string, port?: string, password?: string, pid?: string) {
    super('Failed to parse process arguments')
    this.rawStdout = rawStdout
    this.port = port
    this.password = password
    this.pid = pid
  }
}

/**
 * Locates a League Client and retrieves the credentials for the LCU API
 * from the found process
 *
 * If options.awaitConnection is false the promise will resolve into a
 * rejection if a League Client is not running
 *
 * @param {AuthenticationOptions} [options] Authentication options, if any
 * @throws InvalidPlatformError If the environment is not running
 * windows/linux/darwin
 * @throws ClientNotFoundError If the League Client could not be found
 * @throws ClientElevatedPermsError If the League Client is running as administrator and the script is not (Windows only)
 */
export async function authenticate(options?: AuthenticationOptions): Promise<Credentials> {
  // Check if the platform is supported (Winodows, Linux, Darwin/MacOS)
  if (!['win32', 'linux', 'darwin'].includes(process.platform)) {
    throw new InvalidPlatformError()
  }

  async function tryAuthenticate(): Promise<Credentials> {
    const rawStdout = await getProcessArgs(options)
    return parseProcessArgs(rawStdout, options?.unsafe, options?.certificate)
  }

  if (options?.awaitConnection) {
    // Poll until a client is found, attempting to resolve every
    // `options.pollInterval` milliseconds
    return new Promise(function self(resolve, reject) {
      tryAuthenticate()
        .then((result) => {
          resolve(result)
        })
        .catch((err) => {
          if (err instanceof ClientElevatedPermsError) reject(err)
          setTimeout(self, options?.pollInterval ?? DEFAULT_POLL_INTERVAL, resolve, reject)
        })
    })
  } else {
    return tryAuthenticate()
  }
}

/**
 * Retrieves the command line arguments for the League Client or options.name if provided.
 *
 * @param {AuthenticationOptions} options Authentication options provided by the user, if any
 * @throws {ClientNotFoundError} If the League Client process is not found.
 * @throws {ClientElevatedPermsError} If the user is running the client as an administrator, preventing process detection.
 * @internal
 */
export async function getProcessArgs(options?: AuthenticationOptions): Promise<string> {
  const name = options?.name ?? DEFAULT_NAME
  const isWindows = process.platform === 'win32'

  let command: string
  if (!isWindows) {
    command = `ps x -o args | grep '${name}'`
  } else if (isWindows && options?.useDeprecatedWmic === true) {
    command = `wmic process where caption='${name}.exe' get commandline`
  } else {
    command = `Get-CimInstance -Query "SELECT * from Win32_Process WHERE name LIKE '${name}.exe'" | Select-Object -ExpandProperty CommandLine`
  }

  const executionOptions = isWindows ? { shell: options?.windowsShell ?? ('powershell' as string) } : {}

  try {
    const { stdout: rawStdout } = await exec(command, executionOptions)
    return rawStdout
  } catch (err) {
    if (options?.__internalDebug) console.error(err)
    // Check if the user is running the client as an administrator leading to not being able to find the process
    // Requires PowerShell 3.0 or higher
    if (executionOptions.shell === 'powershell') {
      const { stdout: isAdmin } = await exec(
        `if ((Get-Process -Name ${name} -ErrorAction SilentlyContinue | Where-Object {!$_.Handle -and !$_.Path})) {Write-Output "True"} else {Write-Output "False"}`,
        executionOptions
      )
      if (isAdmin.includes('True')) throw new ClientElevatedPermsError()
    }
    throw new ClientNotFoundError()
  }
}

/**
 * Process the command line arguments and return the credentials
 *
 * @param {string} rawStdout The raw stdout from the command line
 * @param {boolean} [unsafe] Does the user want unsafe requests? Default: False
 * @param {string} [cert] User specified certificate, if any
 * @internal
 */
export function parseProcessArgs(rawStdout: string, unsafe: boolean = false, cert?: string): Credentials {
  const portRegex = /--app-port=([0-9]+)(?= *"| --)/
  const passwordRegex = /--remoting-auth-token=(.+?)(?= *"| --)/
  const pidRegex = /--app-pid=([0-9]+)(?= *"| --)/

  // Remove newlines from stdout
  const stdout = rawStdout.replace(/\n|\r/g, '')
  const port = stdout.match(portRegex)?.[1]
  const password = stdout.match(passwordRegex)?.[1]
  const pid = stdout.match(pidRegex)?.[1]
  if (port === undefined || password === undefined || pid === undefined || isNaN(Number(port)) || isNaN(Number(pid)))
    throw new ProcessArgsParsingError(rawStdout, port, password, pid)

  /**
   * If a user-provided certificate is available, use it. Otherwise, if unsafe requests are allowed, set it to undefined.
   * Finally, if neither of those conditions are met, default to the Riot Games certificate.
   * See flow chart for this here: https://github.com/matsjla/league-connect/pull/44#issuecomment-790384881
   */
  const certificate = cert ?? (unsafe ? undefined : RIOT_GAMES_CERT)

  return {
    port: Number(port),
    pid: Number(pid),
    password,
    certificate
  }
}
