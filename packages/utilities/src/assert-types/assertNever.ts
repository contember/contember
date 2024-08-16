export function assertNever(_: never): never {
	throw new Error('Exhaustive Error: This line should never be reached.')
}
