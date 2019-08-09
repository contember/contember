import { GraphQLExtension, GraphQLResponse } from 'graphql-extensions'

class ErrorHandlerExtension extends GraphQLExtension {
	willSendResponse({
		graphqlResponse,
		context,
	}: {
		graphqlResponse: GraphQLResponse
		context: ErrorHandlerExtension.Context
	}) {
		if (context.errorHandler !== undefined && graphqlResponse.errors && graphqlResponse.errors.length > 0) {
			context.errorHandler(graphqlResponse.errors)
		}
	}
}

namespace ErrorHandlerExtension {
	export interface Context {
		errorHandler: (errors: readonly any[]) => void
	}
}
export default ErrorHandlerExtension
