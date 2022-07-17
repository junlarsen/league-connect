export function trim(s: string): string {
  let r = s
  while (r.startsWith('/')) {
    r = r.substring(1)
  }
  return r
}
