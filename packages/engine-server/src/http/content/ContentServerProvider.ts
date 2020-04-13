import { ContentSchemaResolver } from './ContentSchemaResolver'
import { GraphQlSchemaFactory } from './GraphQlSchemaFactory'
import { ContentApolloServerFactory } from './ContentApolloServerFactory'
import Project from '../../config/Project'
import { Schema } from '@contember/schema'
import { Identity } from '@contember/engine-common/dist/src/auth/Identity'
import { AllowAllPermissionFactory } from '@contember/schema-definition'
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
		const schema = modifySchema(await this.contentSchemaFactory.getSchema(db, stage.slug))

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

const modifySchema = (schema: Schema): Schema => {
	if (!schema.acl.roles[Identity.ProjectRole.ADMIN]) {
		schema = {
			...schema,
			acl: {
				...schema.acl,
				roles: {
					...schema.acl.roles,
					[Identity.ProjectRole.ADMIN]: {
						stages: '*',
						variables: {},
						entities: new AllowAllPermissionFactory().create(schema.model),
						s3: {
							'**': {
								upload: true,
								read: true,
							},
						},
					},
				},
			},
		}
	}
	return schema
}
