import { ApolloServerPlugin, GraphQLRequestListener } from 'apollo-server-plugin-base'
import { ExtendedGraphqlContext } from './SystemServerProvider'

export class SchemaCacheCleanerPlugin implements ApolloServerPlugin<ExtendedGraphqlContext> {
	requestDidStart({}): GraphQLRequestListener<ExtendedGraphqlContext> {
		return {
			willSendResponse({ context }) {
				context.koaContext.state.projectContainer.contentSchemaResolver.clearCache()
			},
		}
	}
}
