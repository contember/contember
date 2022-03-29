import { GraphQLError } from 'graphql'

export class UserInputError extends GraphQLError {
	constructor(message: string) {
		super(message)
		this.extensions.code = 'UserInputError'
	}
}

export class ForbiddenError extends GraphQLError {
	constructor(message: string) {
		super(message)
		this.extensions.code = 'ForbiddenError'
	}
}
