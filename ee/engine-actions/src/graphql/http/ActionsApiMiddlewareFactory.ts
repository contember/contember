import { HttpController } from '@contember/engine-http'
import { ActionsGraphQLHandler } from './ActionsGraphQLHandlerFactory'
import { ActionsContext } from '../resolvers/ActionsContext'
import { ActionsContextResolver } from './ActionsContextResolver'
import { AuthorizationScope, Authorizator } from '@contember/authorization'
import { Identity } from '../../authorization'
import { ForbiddenError } from '@contember/graphql-utils'

export class ActionsApiMiddlewareFactory {
	constructor(
		private readonly actionsContextResolver: ActionsContextResolver,
		private readonly actionsGraphQLHandler: ActionsGraphQLHandler,
		private readonly authorizator: Authorizator<Identity>,
	) {
	}

	create(): HttpController {
		return async ctx => {
			const { timer, logger, koa } = ctx
			const { projectContainer, identity } = await this.actionsContextResolver.resolve(ctx)

			const systemDatabase = projectContainer.systemDatabaseContextFactory.create()

			logger.debug('Actions query processing started')
			const graphqlContext: ActionsContext = {
				db: systemDatabase,
				logger,
				contentSchemaResolver: projectContainer.contentSchemaResolver,
				requireAccess: async (action, message) => {
					if (!(await this.authorizator.isAllowed(identity, new AuthorizationScope.Global(), action))) {
						throw new ForbiddenError(message || 'Forbidden')
					}
				},
			}
			const handler = this.actionsGraphQLHandler

			await timer('GraphQL', () => handler({
				request: koa.request,
				response: koa.response,
				createContext: () => graphqlContext,
			}))
			logger.debug('Actions query finished')
		}
	}
}
