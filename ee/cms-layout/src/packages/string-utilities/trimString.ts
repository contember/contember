/**
 * Trims the provided string of any characters in the provided set.
 *
 * @param value The string to trim.
 * @param characters The characters to remove.
 */
export function trimString(value: string, characters: string) {
  const regExp = new RegExp(`^[${characters}]*|[${characters}]*$`, 'g')

  return value.replace(regExp, '')
}
