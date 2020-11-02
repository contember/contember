import { AuthenticationError } from 'apollo-server-koa'
import { ApolloError } from 'apollo-server-errors'
import { ApolloError as ApolloCoreError, GraphQLRequestContext } from 'apollo-server-core'
import { UserError } from '@contember/engine-content-api'
import { GraphQLError } from 'graphql'
import { extractOriginalError } from './errorExtract'
import { ApolloServerPlugin, GraphQLRequestListener } from 'apollo-server-plugin-base'

interface ErrorContext {
	user: string
	body: string
	project?: string
	url: string
	module: string
}

export type ErrorLogger = (error: any, context: ErrorContext) => void

export type ErrorContextProvider = () => Pick<ErrorContext, 'url' | 'body' | 'user'>

type Context = { errorContextProvider?: ErrorContextProvider }

export class ErrorHandlerPlugin implements ApolloServerPlugin {
	constructor(
		private readonly projectSlug: string | undefined,
		private readonly module: string,
		private readonly errorLogger: ErrorLogger,
	) {}

	requestDidStart(requestContext: GraphQLRequestContext<Context>): GraphQLRequestListener<Context> {
		return {
			willSendResponse: ({ response, context }) => {
				const errorContextProvider = context.errorContextProvider
				if (response.errors && errorContextProvider) {
					response.errors = response.errors.map((it: any) => this.processError(it, errorContextProvider))
				}
			},
		}
	}

	processError(error: any, errorContextProvider: ErrorContextProvider): any {
		if (error instanceof AuthenticationError) {
			return { message: error.message, locations: undefined, path: undefined }
		}
		if (error instanceof ApolloError) {
			return error
		}
		const originalError = extractOriginalError(error)
		if (
			originalError instanceof GraphQLError ||
			originalError instanceof ApolloError ||
			originalError instanceof ApolloCoreError
		) {
			return error
		}
		if (originalError instanceof UserError) {
			return { message: error.message, locations: error.locations, path: error.path }
		}
		// eslint-disable-next-line no-console
		console.error(originalError || error)
		this.errorLogger(originalError || error, {
			project: this.projectSlug,
			module: this.module,
			...errorContextProvider(),
		})

		return { message: 'Internal server error', locations: undefined, path: undefined }
	}
}
