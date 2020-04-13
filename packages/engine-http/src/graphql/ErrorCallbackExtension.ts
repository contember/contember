import { GraphQLExtension, GraphQLResponse } from 'graphql-extensions'

class ErrorCallbackExtension extends GraphQLExtension {
	willSendResponse({
		graphqlResponse,
		context,
	}: {
		graphqlResponse: GraphQLResponse
		context: ErrorCallbackExtension.Context
	}) {
		if (context.errorHandler !== undefined && graphqlResponse.errors && graphqlResponse.errors.length > 0) {
			context.errorHandler(graphqlResponse.errors)
		}
	}
}

namespace ErrorCallbackExtension {
	export interface Context {
		errorHandler: (errors: readonly any[]) => void
	}
}
export default ErrorCallbackExtension
