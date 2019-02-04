import { Config } from 'apollo-server-core'
import { ApolloServer, AuthenticationError } from 'apollo-server-koa'
import typeDefs from '../system-api/schema/system.graphql'
import ResolverContext from '../system-api/resolvers/ResolverContext'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import Authorizator from '../core/authorization/Authorizator'
import { Acl } from 'cms-common'
import Identity from '../common/auth/Identity'
import { ApolloError } from 'apollo-server-errors'
import SystemExecutionContainer from '../system-api/SystemExecutionContainer'
import KnexWrapper from '../core/knex/KnexWrapper'
import ErrorHandlerExtension from '../core/graphql/ErrorHandlerExtension'

class SystemApolloServerFactory {
	constructor(private readonly resolvers: Config['resolvers'],
	            private readonly authorizator: Authorizator<Identity>,
	            private readonly executionContainerFactory: SystemExecutionContainer.Factory) {
	}

	create(projectRoles: string[], variables: Acl.VariablesMap): ApolloServer {
		return new ApolloServer({
			typeDefs,
			resolvers: this.resolvers,
			extensions: [
				() => new ErrorHandlerExtension(),
			],
			formatError: (error: any) => {
				if (error instanceof AuthenticationError) {
					return error.message
				}
				if (error instanceof ApolloError) {
					return error
				}
				console.error(error.originalError || error)
				return 'Internal server error'
			},
			context: ({ ctx }: {
				ctx: AuthMiddlewareFactory.ContextWithAuth & {
					state: {
						db: KnexWrapper,
						errorHandler: ErrorHandlerExtension.Context['errorHandler']
					}
				}
			}): ResolverContext => {
				const authResult = ctx.state.authResult
				if (authResult === undefined) {
					throw new AuthenticationError('/system endpoint requires authorization')
				}
				if (!authResult.valid) {
					throw new AuthenticationError(`Auth failure: ${authResult.error}`)
				}

				return new ResolverContext(
					new Identity.StaticIdentity(authResult.identityId, authResult.roles, {}),
					variables,
					this.authorizator,
					this.executionContainerFactory.create(ctx.state.db),
					ctx.state.errorHandler
				)
			},
		})
	}
}

export default SystemApolloServerFactory
