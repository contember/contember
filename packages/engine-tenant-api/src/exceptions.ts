export class ImplementationException extends Error {
	constructor(public readonly message: string = '') {
		super(message)
	}
}
