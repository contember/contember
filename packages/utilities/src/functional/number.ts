/**
 * Returns the value if it is a number, otherwise returns the fallback.
 * @param value - The value to check.
 * @param fallback - The fallback value.
 * @returns The value or the fallback.
 */
export function numberOrFallback(value: unknown, fallback: number): number {
	return typeof value === 'number' ? value : fallback
}
