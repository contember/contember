import { ContentSchemaResolver } from './ContentSchemaResolver'
import { GraphQlSchemaFactory } from './GraphQlSchemaFactory'
import { ContentApolloServerFactory } from './ContentApolloServerFactory'
import Project from '../Project'
import { ApolloServer } from 'apollo-server-koa'
import LRUCache from 'lru-cache'
import { GraphQLSchema } from 'graphql'
import { DatabaseContext } from '@contember/engine-system-api'

export class ContentServerProvider {
	private cache = new LRUCache<GraphQLSchema, ApolloServer>({
		max: 100,
	})

	constructor(
		private readonly contentSchemaFactory: ContentSchemaResolver,
		private readonly graphqlSchemaFactory: GraphQlSchemaFactory,
		private readonly apolloServerFactory: ContentApolloServerFactory,
	) {}

	async get(db: DatabaseContext, stage: Project.Stage, projectRoles: string[]): Promise<ApolloServer> {
		const schema = await this.contentSchemaFactory.getSchema(db, stage.slug)

		const [dataSchema, permissions] = await this.graphqlSchemaFactory.create(schema, {
			projectRoles: projectRoles,
		})
		const server = this.cache.get(dataSchema)
		if (server) {
			return server
		}

		const newServer = this.apolloServerFactory.create(permissions, schema, dataSchema)
		this.cache.set(dataSchema, newServer)
		return newServer
	}
}
