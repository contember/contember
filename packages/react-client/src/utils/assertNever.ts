export function assertNever(_: never): asserts _ is never {
	throw new Error()
}
