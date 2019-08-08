import { KoaMiddleware } from '../core/koa/types'
import SchemaVersionBuilder from '../content-schema/SchemaVersionBuilder'
import Project from '../config/Project'
import GraphQlSchemaFactory from './GraphQlSchemaFactory'
import AuthMiddlewareFactory from './AuthMiddlewareFactory'
import ProjectMemberMiddlewareFactory from './ProjectMemberMiddlewareFactory'
import ContentApolloServerFactory from './ContentApolloServerFactory'
import { graphqlKoa } from 'apollo-server-koa/dist/koaApollo'
import { Acl, Model, Schema } from 'cms-common'
import TimerMiddlewareFactory from './TimerMiddlewareFactory'

class ContentApolloMiddlewareFactory {
	private schemaCache: { [stage: string]: Schema } = {}

	constructor(
		private readonly project: Project,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly graphqlSchemaFactory: GraphQlSchemaFactory,
		private readonly apolloServerFactory: ContentApolloServerFactory,
		private readonly currentSchema: Schema,
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
			if (!this.schemaCache[stage.id]) {
				this.schemaCache[stage.id] = this.project.ignoreMigrations
					? this.currentSchema
					: await this.schemaVersionBuilder.buildSchemaForStage(stage.id)
			}
			const schema = this.schemaCache[stage.id]

			const [dataSchema, permissions] = await this.graphqlSchemaFactory.create(stage.slug, schema, {
				projectRoles: ctx.state.projectRoles,
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

export default ContentApolloMiddlewareFactory
