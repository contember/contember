import { ApolloServerPlugin, GraphQLRequestListener } from 'apollo-server-plugin-base'
import { GraphQLRequestContext } from 'apollo-server-core'

export type GraphQLInfoState = {
	graphql?: {
		operationName: string
	}
}

export class GraphqlInfoProviderPlugin implements ApolloServerPlugin {
	requestDidStart(requestContext: GraphQLRequestContext): GraphQLRequestListener {
		return {
			didResolveOperation: requestContext => {
				requestContext.context.koaContext.state.graphql = {
					operationName: requestContext.operation.operation,
				}
			},
		}
	}
}
