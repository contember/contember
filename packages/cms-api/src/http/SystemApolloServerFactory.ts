import { Config } from 'apollo-server-core'
import { ApolloServer, AuthenticationError } from 'apollo-server-koa'
import typeDefs from '../system-api/schema/system.graphql'
import ResolverContext from '../system-api/resolvers/ResolverContext'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'

class SystemApolloServerFactory {
	constructor(private readonly resolvers: Config['resolvers']) {}

	create(): ApolloServer {
		return new ApolloServer({
			typeDefs,
			resolvers: this.resolvers,
			formatError: (error: any) => {
				console.error(error.originalError || error)
				return 'Internal server error'
			},
			context: ({ ctx }: { ctx: AuthMiddlewareFactory.ContextWithAuth }): ResolverContext => {
				if (ctx.state.authResult === undefined) {
					throw new AuthenticationError('/system endpoint requires authorization')
				}
				if (!ctx.state.authResult.valid) {
					throw new AuthenticationError(`Auth failure: ${ctx.state.authResult.error}`)
				}

				//todo auth

				return new ResolverContext()
			},
		})
	}
}

export default SystemApolloServerFactory
