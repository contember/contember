import { GraphQLError } from 'graphql'
import { UserError } from '@contember/engine-content-api'
import { GraphQLListener } from './execution'
import { ForbiddenError } from 'apollo-server-errors'

interface ErrorContext {
	user: string
	body: string
	project?: string
	url: string
	module: string
}

export type ErrorLogger = (error: any, context: ErrorContext) => void

export const extractOriginalError = (e: Error): Error => {
	if (e instanceof GraphQLError && e.originalError) {
		return extractOriginalError(e.originalError)
	}
	if ('errors' in e && Array.isArray((e as any).errors) && (e as any).errors.length === 1) {
		return extractOriginalError((e as any).errors[0])
	}
	return e
}

const processError = (error: any, errorHandler: (error: any) => void) => {
	const originalError = extractOriginalError(error)
	if (originalError instanceof GraphQLError || originalError instanceof ForbiddenError) {
		return error
	}
	if (originalError instanceof UserError) {
		return { message: error.message, locations: error.locations, path: error.path }
	}
	// eslint-disable-next-line no-console
	console.error(originalError || error)
	errorHandler(originalError || error)

	return { message: 'Internal server error', locations: undefined, path: undefined }
}

export const createErrorListener = <State>(
	errorHandler: (error: any, context: State) => void,
): GraphQLListener<State> => ({
	onResponse: ({ response, context }) => {
		if (response.errors) {
			response.errors = response.errors.map((it: any) => processError(it, err => errorHandler(err, context)))
		}
	},
})
