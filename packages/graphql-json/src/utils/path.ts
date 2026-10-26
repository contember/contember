/**
 * Path utilities for tracking response paths during execution
 */

export interface Path {
	readonly prev: Path | undefined
	readonly key: string | number
	readonly typename: string | undefined
}

/**
 * Add a key to the path
 */
export function addPath(
	prev: Path | undefined,
	key: string | number,
	typename?: string,
): Path {
	return { prev, key, typename }
}

/**
 * Convert path to array
 */
export function pathToArray(path: Path | undefined): (string | number)[] {
	const result: (string | number)[] = []
	let current = path
	while (current) {
		result.unshift(current.key)
		current = current.prev
	}
	return result
}
