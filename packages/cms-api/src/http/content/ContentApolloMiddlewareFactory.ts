import { KoaMiddleware } from '../../core/koa'
import { SchemaVersionBuilder } from '@contember/engine-system-api'
import Project from '../../config/Project'
import { AuthMiddlewareFactory } from '../AuthMiddlewareFactory'
import { ContentApolloServerFactory } from './ContentApolloServerFactory'
import { graphqlKoa } from 'apollo-server-koa/dist/koaApollo'
import { Acl, Schema } from '@contember/schema'
import { TimerMiddlewareFactory } from '../TimerMiddlewareFactory'
import { GraphQlSchemaFactory } from './GraphQlSchemaFactory'
import { ProjectMemberMiddlewareFactory } from '../project-common'

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
				this.schemaCache[stage.slug] = this.project.ignoreMigrations
					? this.currentSchema!
					: await this.schemaVersionBuilder.buildSchemaForStage(stage.slug)
			}
			const schema = this.schemaCache[stage.slug]

			const [dataSchema, permissions] = await this.graphqlSchemaFactory.create(stage.slug, schema, {
				projectRoles: ctx.state.projectMemberships.map(it => it.role),
				globalRoles: ctx.state.authResult.roles,
			})
			ctx.state.schema = schema
			ctx.state.permissions = permissions

			const server = this.apolloServerFactory.create(dataSchema)

			await ctx.state.timer('exec graphql', () => graphqlKoa(server.createGraphQLServerOptions.bind(server))(ctx, next))
		}
	}
}

namespace ContentApolloMiddlewareFactory {
	export interface KoaState {
		schema: Schema
		permissions: Acl.Permissions
	}
}

export { ContentApolloMiddlewareFactory }
