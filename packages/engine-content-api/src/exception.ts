export class ImplementationException extends Error {
	constructor(message: string = '') {
		super(message)
	}
}

export class UserError extends Error {
	public path = [] // otherwise graphql converts it to GraphqlError
}
