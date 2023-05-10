export class AssertionError extends Error {
	constructor(value: unknown, that: string = 'value to pass assertion') {
		super(`Expecting ${that}, ${JSON.stringify(value)} given`)
	}
}
