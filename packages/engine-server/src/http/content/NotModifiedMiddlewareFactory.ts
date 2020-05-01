import Koa from 'koa'
import { ProjectResolveMiddlewareFactory } from '../project-common'
import { StageResolveMiddlewareFactory } from './StageResolveMiddlewareFactory'
import { KoaMiddleware } from '../../core/koa'
import { LatestEventIdByStageQuery } from '@contember/engine-system-api'
import { TimerMiddlewareFactory } from '../TimerMiddlewareFactory'

export class NotModifiedMiddlewareFactory {
	create(): Koa.Middleware {
		const notModifiedMiddleware: KoaMiddleware<ProjectResolveMiddlewareFactory.KoaState &
			StageResolveMiddlewareFactory.KoaState &
			TimerMiddlewareFactory.KoaState> = async (ctx, next) => {
			const NotModifiedHeaderName = 'x-contember-ref'
			if (typeof ctx.request.headers[NotModifiedHeaderName] == undefined) {
				return next()
			}
			const requestRef = ctx.request.get(NotModifiedHeaderName)
			const body = ctx.request.body
			// todo better detection of mutations
			const isMutation = typeof body === 'object' && 'query' in body && String(body.query).includes('mutation')
			if (isMutation) {
				return await next()
			}
			const latestEvent = await ctx.state.timer('NotModifiedCheck', () => {
				const queryHandler = ctx.state.projectContainer.systemQueryHandler
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
}
