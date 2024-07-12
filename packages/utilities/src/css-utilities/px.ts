/**
 * Converts a value to a string in the format '10px'
 *
 * @param value - The value to convert to a string.
 * @returns Returns a string in the format '10px' or '' when value is falsy.
 */
export function px<V extends number | false | null | undefined>(value?: V): string {
	return typeof value === 'number' && !(isNaN(value) || value === Infinity || value === -Infinity) ? value + 'px' : ''
}
