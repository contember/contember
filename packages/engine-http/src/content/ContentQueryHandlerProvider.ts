import { ContentSchemaResolver } from './ContentSchemaResolver'
import { GraphQlSchemaFactory } from './GraphQlSchemaFactory'
import { ContentQueryHandlerFactory, KoaState } from './ContentQueryHandlerFactory'
import Project from '../Project'
import LRUCache from 'lru-cache'
import { GraphQLSchema } from 'graphql'
import { DatabaseContext } from '@contember/engine-system-api'
import { KoaMiddleware } from '../koa'

export class ContentQueryHandlerProvider {
	private cache = new LRUCache<GraphQLSchema, KoaMiddleware<KoaState>>({
		max: 100,
	})

	constructor(
		private readonly contentSchemaFactory: ContentSchemaResolver,
		private readonly graphqlSchemaFactory: GraphQlSchemaFactory,
		private readonly handlerFactory: ContentQueryHandlerFactory,
	) {}

	async get(db: DatabaseContext, stage: Project.Stage, projectRoles: string[]): Promise<KoaMiddleware<KoaState>> {
		const schema = await this.contentSchemaFactory.getSchema(db, stage.slug)

		const [dataSchema, permissions] = await this.graphqlSchemaFactory.create(schema, {
			projectRoles: projectRoles,
		})
		const middleware = this.cache.get(dataSchema)
		if (middleware) {
			return middleware
		}

		const newMiddleware = this.handlerFactory.create(permissions, schema, dataSchema)
		this.cache.set(dataSchema, newMiddleware)
		return newMiddleware
	}
}
