export class ImplementationException extends Error {}

export class UserError extends Error {
	public path = [] // otherwise graphql converts it to GraphqlError
}
