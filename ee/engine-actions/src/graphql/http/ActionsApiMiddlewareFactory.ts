import { HttpController } from '@contember/engine-http'
import { ActionsGraphQLHandler } from './ActionsGraphQLHandlerFactory'
import { ActionsContext } from '../resolvers/ActionsContext'
import { ActionsContextResolver } from './ActionsContextResolver'

export class ActionsApiMiddlewareFactory {
	constructor(
		private readonly actionsContextResolver: ActionsContextResolver,
		private readonly actionsGraphQLHandler: ActionsGraphQLHandler,
	) {
	}

	create(): HttpController {
		return async ctx => {
			const { timer, logger, koa } = ctx
			const { projectContainer } = await this.actionsContextResolver.resolve(ctx)

			const systemDatabase = projectContainer.systemDatabaseContextFactory.create()

			logger.debug('Actions query processing started')
			const graphqlContext: ActionsContext = {
				db: systemDatabase,
				logger,
				contentSchemaResolver: projectContainer.contentSchemaResolver,
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
