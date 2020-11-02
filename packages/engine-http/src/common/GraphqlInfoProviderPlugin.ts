import { ApolloServerPlugin, GraphQLRequestListener } from 'apollo-server-plugin-base'
import { GraphQLRequestContext } from 'apollo-server-core'
import { KoaContext } from '../koa'

export type GraphQLInfoState = {
	graphql?: {
		operationName: string
	}
}

type Context = { koaContext?: KoaContext<GraphQLInfoState> }

export class GraphqlInfoProviderPlugin implements ApolloServerPlugin<Context> {
	requestDidStart(requestContext: GraphQLRequestContext<Context>): GraphQLRequestListener<Context> {
		return {
			didResolveOperation: requestContext => {
				if (requestContext.context.koaContext) {
					requestContext.context.koaContext.state.graphql = {
						operationName: requestContext.operation.operation,
					}
				}
			},
		}
	}
}
