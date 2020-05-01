import { ProjectResolveMiddlewareState } from '../project-common'
import { StageResolveMiddlewareState } from './StageResolveMiddlewareFactory'
import { KoaMiddleware } from '../koa'
import { LatestEventIdByStageQuery } from '@contember/engine-system-api'
import { TimerMiddlewareState } from '../common'

type KoaState = ProjectResolveMiddlewareState & StageResolveMiddlewareState & TimerMiddlewareState

export const createNotModifiedMiddleware = () => {
	const notModifiedMiddleware: KoaMiddleware<KoaState> = async (ctx, next) => {
		const NotModifiedHeaderName = 'x-contember-ref'
		if (typeof ctx.request.headers[NotModifiedHeaderName] == undefined) {
			return next()
		}
		const requestRef = ctx.request.get(NotModifiedHeaderName)
		const body = ctx.request.body
		const isMutation = typeof body === 'object' && 'query' in body && String(body.query).includes('mutation')
		if (isMutation) {
			return await next()
		}
		const latestEvent = await ctx.state.timer('NotModifiedCheck', () => {
			const db = ctx.state.projectContainer.systemDatabaseContextFactory.create(undefined)
			const queryHandler = db.queryHandler
			const stageSlug = ctx.state.stage.slug
			return queryHandler.fetch(new LatestEventIdByStageQuery(stageSlug))
		})
		if (latestEvent === requestRef) {
			ctx.status = 304
			return
		}
		await next()
		if (ctx.status === 200) {
			ctx.response.set(NotModifiedHeaderName, latestEvent)
		}
	}
	return notModifiedMiddleware
}
