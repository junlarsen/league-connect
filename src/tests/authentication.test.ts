import { Credentials, ProcessArgsParsingError, authenticate, getProcessArgs, parseProcessArgs } from '../authentication'

// Plaintext contents of riotgames.pem, selfsigned cert.
// Yes, this is intentionally supposed to be in the test code.
// This cert is public and downloadable from the Riot Games
// Developer portal.
const PLAINTEXT_CERT = `-----BEGIN CERTIFICATE-----
MIIEIDCCAwgCCQDJC+QAdVx4UDANBgkqhkiG9w0BAQUFADCB0TELMAkGA1UEBhMC
VVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFTATBgNVBAcTDFNhbnRhIE1vbmljYTET
MBEGA1UEChMKUmlvdCBHYW1lczEdMBsGA1UECxMUTG9MIEdhbWUgRW5naW5lZXJp
bmcxMzAxBgNVBAMTKkxvTCBHYW1lIEVuZ2luZWVyaW5nIENlcnRpZmljYXRlIEF1
dGhvcml0eTEtMCsGCSqGSIb3DQEJARYeZ2FtZXRlY2hub2xvZ2llc0ByaW90Z2Ft
ZXMuY29tMB4XDTEzMTIwNDAwNDgzOVoXDTQzMTEyNzAwNDgzOVowgdExCzAJBgNV
BAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRUwEwYDVQQHEwxTYW50YSBNb25p
Y2ExEzARBgNVBAoTClJpb3QgR2FtZXMxHTAbBgNVBAsTFExvTCBHYW1lIEVuZ2lu
ZWVyaW5nMTMwMQYDVQQDEypMb0wgR2FtZSBFbmdpbmVlcmluZyBDZXJ0aWZpY2F0
ZSBBdXRob3JpdHkxLTArBgkqhkiG9w0BCQEWHmdhbWV0ZWNobm9sb2dpZXNAcmlv
dGdhbWVzLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKoJemF/
6PNG3GRJGbjzImTdOo1OJRDI7noRwJgDqkaJFkwv0X8aPUGbZSUzUO23cQcCgpYj
21ygzKu5dtCN2EcQVVpNtyPuM2V4eEGr1woodzALtufL3Nlyh6g5jKKuDIfeUBHv
JNyQf2h3Uha16lnrXmz9o9wsX/jf+jUAljBJqsMeACOpXfuZy+YKUCxSPOZaYTLC
y+0GQfiT431pJHBQlrXAUwzOmaJPQ7M6mLfsnpHibSkxUfMfHROaYCZ/sbWKl3lr
ZA9DbwaKKfS1Iw0ucAeDudyuqb4JntGU/W0aboKA0c3YB02mxAM4oDnqseuKV/CX
8SQAiaXnYotuNXMCAwEAATANBgkqhkiG9w0BAQUFAAOCAQEAf3KPmddqEqqC8iLs
lcd0euC4F5+USp9YsrZ3WuOzHqVxTtX3hR1scdlDXNvrsebQZUqwGdZGMS16ln3k
WObw7BbhU89tDNCN7Lt/IjT4MGRYRE+TmRc5EeIXxHkQ78bQqbmAI3GsW+7kJsoO
q3DdeE+M+BUJrhWorsAQCgUyZO166SAtKXKLIcxa+ddC49NvMQPJyzm3V+2b1roP
SvD2WV8gRYUnGmy/N0+u6ANq5EsbhZ548zZc+BI4upsWChTLyxt2RxR7+uGlS1+5
EcGfKZ+g024k/J32XP4hdho7WYAS2xMiV83CfLR/MNi8oSMaVQTdKD8cpgiWJk3L
XWehWA==
-----END CERTIFICATE-----
`

describe('validating regex patterns', () => {
  let expected: Credentials
  beforeEach(() => {
    expected = {
      port: 12345,
      password: 'R69heN3CknTbqW6uUFXyoE',
      pid: 1234,
      // '\n' makes PLAINTEXT_CERT equal to the Riot Games selfsigned cert
      certificate: '\n' + PLAINTEXT_CERT
    }
  })
  test('seperated by spaces', () => {
    const stdout = `--app-port=12345 --remoting-auth-token=R69heN3CknTbqW6uUFXyoE --app-pid=1234`
    const credentials = parseProcessArgs(stdout)
    expect(credentials).toBeDefined()
    expect(credentials).toMatchObject(expected)
  })
  test('surrounded by quotes', () => {
    const stdout = `"--app-port=12345" "--remoting-auth-token=R69heN3CknTbqW6uUFXyoE" "--app-pid=1234"`
    const credentials = parseProcessArgs(stdout)
    expect(credentials).toBeDefined()
    expect(credentials).toMatchObject(expected)
  })
  test('including possible symbols in auth token', () => {
    expected.password = 'R69he__CknTbq--uUFXyoE'
    const stdout = `--app-port=12345 --remoting-auth-token=R69he__CknTbq--uUFXyoE --app-pid=1234`
    parseProcessArgs(stdout)
    const credentials = parseProcessArgs(stdout)
    expect(credentials).toBeDefined()
    expect(credentials).toMatchObject(expected)
    expect(credentials).toEqual(expected)
  })
  test('unsafe cert', () => {
    expected.certificate = undefined
    const stdout = `--app-port=12345 --remoting-auth-token=R69heN3CknTbqW6uUFXyoE --app-pid=1234`
    const credentials = parseProcessArgs(stdout, true)
    expect(credentials).toBeDefined()
    expect(credentials).toEqual(expected)
    expect(credentials.certificate).toBeUndefined()
  })
  test('custom cert', () => {
    expected.certificate = PLAINTEXT_CERT
    const stdout = `--app-port=12345 --remoting-auth-token=R69heN3CknTbqW6uUFXyoE --app-pid=1234`
    const credentials = parseProcessArgs(stdout, false, PLAINTEXT_CERT)
    expect(credentials).toBeDefined()
    expect(credentials).toEqual(expected)
    expect(credentials.certificate).toEqual(expected.certificate)
  })
  test('error class returns invalid args', () => {
    const stdout = `--app-port=abcde --remoting-auth-token=R69heN3CknTbqW6uUFXyoE --app-pid=1a34`
    try {
      parseProcessArgs(stdout)
    } catch (e: any) {
      expect(e).toBeInstanceOf(ProcessArgsParsingError)
      expect(e.rawStdout).toEqual(stdout)
      expect(e.port).toBeUndefined()
      expect(e.password).toEqual('R69heN3CknTbqW6uUFXyoE')
      expect(e.pid).toBeUndefined()
    }
  })
})

/** Requires LCU to be open */
describe('authenticating to the api', () => {
  test('getting command line arguments', async () => {
    const args = await getProcessArgs()
    expect(args).toBeDefined()
  })
  test('locating the league client', async () => {
    const credentials = await authenticate()

    expect(credentials).toBeDefined()
    expect(credentials?.certificate).toBeDefined()
  })

  test('enabling polling until a client is found', async () => {
    const credentials = await authenticate({
      awaitConnection: true,
      pollInterval: 2500
    })

    expect(credentials).toBeDefined()
    expect(credentials?.certificate).toBeDefined()
  }, 300_000)

  test('authentication using plaintext cert', async () => {
    const credentials = await authenticate({
      certificate: PLAINTEXT_CERT
    })

    expect(credentials).toBeDefined()
    expect(credentials?.certificate).toBeDefined()
  })

  test('authentication using unsafe cert toggles switch', async () => {
    const credentials = await authenticate({
      unsafe: true
    })

    expect(credentials?.certificate).toBeUndefined()
  })
})
