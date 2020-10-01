// Remove all existing prepending slashes
// and add one at the beginning
export function trimSlashes(input: string) {
  let result = input

  while (result.startsWith('/')) {
    result = result.substr(1)
  }

  return `/${result}`
}