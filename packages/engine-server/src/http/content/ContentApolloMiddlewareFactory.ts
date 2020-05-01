import { KoaMiddleware } from '../../core/koa'
import { SchemaVersionBuilder } from '@contember/engine-system-api'
import Project from '../../config/Project'
import { AuthMiddlewareFactory } from '../AuthMiddlewareFactory'
import { ContentApolloServerFactory } from './ContentApolloServerFactory'
import { graphqlKoa } from 'apollo-server-koa/dist/koaApollo'
import { Schema } from '@contember/schema'
import { TimerMiddlewareFactory } from '../TimerMiddlewareFactory'
import { GraphQlSchemaFactory } from './GraphQlSchemaFactory'
import { ProjectMemberMiddlewareFactory } from '../project-common'
import { Identity } from '@contember/engine-common'
import { AllowAllPermissionFactory } from '@contember/schema-definition'

class ContentApolloMiddlewareFactory {
	private schemaCache: { [stage: string]: Schema } = {}

	constructor(
		private readonly project: Project,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly graphqlSchemaFactory: GraphQlSchemaFactory,
		private readonly apolloServerFactory: ContentApolloServerFactory,
		private readonly currentSchema?: Schema,
	) {}

	create(
		stage: Project.Stage,
	): KoaMiddleware<
		AuthMiddlewareFactory.KoaState &
			ProjectMemberMiddlewareFactory.KoaState &
			TimerMiddlewareFactory.KoaState &
			ContentApolloMiddlewareFactory.KoaState
	> {
		return async (ctx, next) => {
			if (!this.schemaCache[stage.slug]) {
				if (this.project.ignoreMigrations && !this.currentSchema) {
					throw new Error('Current schema was not provided, cannot use "ignoreMigrations" option')
				}
				const schema = this.project.ignoreMigrations
					? this.currentSchema!
					: await this.schemaVersionBuilder.buildSchemaForStage(stage.slug)
				this.schemaCache[stage.slug] = this.modifySchema(schema)
			}
			const schema = this.schemaCache[stage.slug]

			const server = await ctx.state.timer('GraphQLServerCreate', async () => {
				const [dataSchema, permissions] = await this.graphqlSchemaFactory.create(schema, {
					projectRoles: ctx.state.projectMemberships.map(it => it.role),
				})

				return this.apolloServerFactory.create(permissions, schema, dataSchema)
			})

			await ctx.state.timer('GraphQL', () => graphqlKoa(server.createGraphQLServerOptions.bind(server))(ctx, next))
		}
	}

	private modifySchema(schema: Schema): Schema {
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
}

namespace ContentApolloMiddlewareFactory {
	export interface KoaState {}
}

export { ContentApolloMiddlewareFactory }
