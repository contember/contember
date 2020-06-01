import { KoaMiddleware } from '../koa'
import { graphqlKoa } from 'apollo-server-koa/dist/koaApollo'
import { ProjectMemberMiddlewareState, ProjectResolveMiddlewareState } from '../project-common'
import { TimerMiddlewareState } from '../common'
import { Client } from '@contember/database'
import { formatSchemaName, unnamedIdentity } from '@contember/engine-system-api'
import { StageResolveMiddlewareState } from './StageResolveMiddlewareFactory'
import { ProvidersState } from '../services'

type KoaState = ProjectMemberMiddlewareState &
	TimerMiddlewareState &
	ProjectResolveMiddlewareState &
	StageResolveMiddlewareState &
	ContentServerMiddlewareState &
	ProvidersState

export const createContentServerMiddleware = (): KoaMiddleware<KoaState> => {
	const contentServer: KoaMiddleware<KoaState> = async (ctx, next) => {
		const projectRoles = ctx.state.projectMemberships.map(it => it.role)
		const stage = ctx.state.stage
		const projectContainer = ctx.state.projectContainer
		const dbContextFactory = ctx.state.projectContainer.systemDatabaseContextFactory
		const dbClient = projectContainer.connection.createClient(formatSchemaName(stage), { module: 'content' })
		ctx.state.db = dbClient
		const server = await ctx.state.timer('GraphQLServerCreate', () =>
			projectContainer.contentServerProvider.get(dbContextFactory.create(unnamedIdentity), stage, projectRoles),
		)

		await ctx.state.timer('GraphQL', () => graphqlKoa(server.createGraphQLServerOptions.bind(server))(ctx, next))
	}
	return contentServer
}

export interface ContentServerMiddlewareState {
	db: Client
}
