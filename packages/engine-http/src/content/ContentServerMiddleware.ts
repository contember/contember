import { KoaMiddleware } from '../koa'
import { ProjectMemberMiddlewareState, ProjectResolveMiddlewareState } from '../project-common'
import { AuthMiddlewareState, TimerMiddlewareState } from '../common'
import { Client } from '@contember/database'
import { formatSchemaName, unnamedIdentity } from '@contember/engine-system-api'
import { StageResolveMiddlewareState } from './StageResolveMiddlewareFactory'
import { ProvidersState } from '../services'

type KoaState = ProjectMemberMiddlewareState &
	TimerMiddlewareState &
	ProjectResolveMiddlewareState &
	StageResolveMiddlewareState &
	ContentServerMiddlewareState &
	ProvidersState &
	AuthMiddlewareState

export const createContentServerMiddleware = (): KoaMiddleware<KoaState> => {
	const contentServer: KoaMiddleware<KoaState> = async (ctx, next) => {
		const projectRoles = ctx.state.projectMemberships.map(it => it.role)
		const stage = ctx.state.stage
		const projectContainer = ctx.state.projectContainer
		const dbContextFactory = ctx.state.projectContainer.systemDatabaseContextFactory
		const dbClient = projectContainer.connection.createClient(formatSchemaName(stage), { module: 'content' })
		ctx.state.db = dbClient
		const handler = await ctx.state.timer('GraphQLServerCreate', () =>
			projectContainer.contentQueryHandlerProvider.get(dbContextFactory.create(unnamedIdentity), stage, projectRoles),
		)

		await ctx.state.timer('GraphQL', () => handler(ctx, next))
	}
	return contentServer
}

export interface ContentServerMiddlewareState {
	db: Client
}
