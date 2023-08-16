
/**
 * Get a list of numbers between start and end, inclusive, with the given step size (defaulting to 1)
 * @param start - The starting number.
 * @param end - The ending number.
 * @param step - The step size, optional, defaults to 1.
 * @returns A list of numbers between start and end, inclusive, with the given step size (defaulting to 1)
 */
export function range(start: number, end: number, step = 1): number[] {
	return Array.from({ length: Math.floor(Math.abs(end - start) / step) + 1 }, (_, i) => start + i * (end > start ? 1 : -1) * Math.abs(step))
}
