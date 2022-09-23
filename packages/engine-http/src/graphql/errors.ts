import { GraphQLError } from 'graphql'
import { UserError } from '@contember/engine-content-api'
import { GraphQLListener } from './execution'
import { ForbiddenError } from '@contember/graphql-utils'
import { logger } from '@contember/logger'

export const extractOriginalError = (e: Error): Error => {
	if (e instanceof GraphQLError && e.originalError) {
		return extractOriginalError(e.originalError)
	}
	if ('errors' in e && Array.isArray((e as any).errors) && (e as any).errors.length === 1) {
		return extractOriginalError((e as any).errors[0])
	}
	return e
}

const processError = (error: any) => {
	const originalError = extractOriginalError(error)
	if (originalError instanceof GraphQLError || originalError instanceof ForbiddenError) {
		return error
	}
	if (originalError instanceof UserError) {
		return { message: error.message, locations: error.locations, path: error.path }
	}
	logger.error(originalError || error)

	return { message: 'Internal server error', locations: undefined, path: undefined }
}

export const createErrorListener = <State>(): GraphQLListener<State> => ({
	onResponse: ({ response, context }) => {
		if (response.errors) {
			response.errors = response.errors.map((it: any) => processError(it))
		}
	},
})
