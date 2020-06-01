import { ApolloServerPlugin, GraphQLRequestListener } from 'apollo-server-plugin-base'
import { GraphQLRequestContext } from 'apollo-server-core'
import { KoaContext } from '../koa'

export type GraphQLInfoState = {
	graphql?: {
		operationName: string
	}
}

export class GraphqlInfoProviderPlugin implements ApolloServerPlugin<{ koaContext: KoaContext<GraphQLInfoState> }> {
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
