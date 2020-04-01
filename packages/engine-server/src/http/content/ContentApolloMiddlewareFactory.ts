import { KoaMiddleware } from '../../core/koa'
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
import { ContentSchemaResolver } from './ContentSchemaResolver'

class ContentApolloMiddlewareFactory {
	constructor(
		private readonly contentSchemaFactory: ContentSchemaResolver,
		private readonly graphqlSchemaFactory: GraphQlSchemaFactory,
		private readonly apolloServerFactory: ContentApolloServerFactory,
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
			const schema = this.modifySchema(await this.contentSchemaFactory.getSchema(stage.slug))

			const [dataSchema, permissions] = await this.graphqlSchemaFactory.create(schema, {
				projectRoles: ctx.state.projectMemberships.map(it => it.role),
			})

			const server = this.apolloServerFactory.create(permissions, schema, dataSchema)

			await ctx.state.timer('exec graphql', () => graphqlKoa(server.createGraphQLServerOptions.bind(server))(ctx, next))
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
