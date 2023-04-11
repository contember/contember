export function px<V extends number>(value: V): `${V}px`;
export function px<V extends false>(value: V): '';
export function px<V extends null>(value: V): '';
export function px<V extends undefined>(value: V): '';
// NOTE: Next overload fixes:
// The call would have succeeded against this implementation, but implementation signatures of overloads are not externally visible.
export function px<V extends number | false | null | undefined>(value?: V): string;
/**
 * Converts a value to a string in the format '10px'
 *
 * @param value The value to convert to a string.
 * @returns Returns a string in the format '10px' or '' when value is falsy.
 */
export function px<V extends number | false | null | undefined>(value?: V): string {
  return typeof value === 'number' && !isNaN(value) ? value + 'px' : ''
}
