import Koa from 'koa'
import { ProjectResolveMiddlewareFactory } from '../project-common'
import { StageResolveMiddlewareFactory } from './StageResolveMiddlewareFactory'
import { KoaMiddleware } from '../../core/koa'
import { LatestEventIdByStageQuery } from '@contember/engine-system-api'

export class NotModifiedMiddlewareFactory {
	create(): Koa.Middleware {
		const notModifiedMiddleware: KoaMiddleware<ProjectResolveMiddlewareFactory.KoaState &
			StageResolveMiddlewareFactory.KoaState> = async (ctx, next) => {
			const requestRef = ctx.request.get('X-Contember-Ref')
			const body = ctx.request.body
			// todo better detection of mutations
			const isMutation = typeof body === 'object' && 'query' in body && String(body.query).includes('mutation')
			if (isMutation || requestRef === undefined) {
				return await next()
			}
			const db = ctx.state.projectContainer.systemDatabaseContextFactory.create(undefined)
			const queryHandler = db.queryHandler
			const stageSlug = ctx.state.stage.slug
			const latestEvent = await queryHandler.fetch(new LatestEventIdByStageQuery(stageSlug))
			if (latestEvent === requestRef) {
				ctx.status = 304
				return
			}
			await next()
			if (ctx.status === 200) {
				ctx.response.set('X-Contember-Ref', latestEvent)
			}
		}
		return notModifiedMiddleware
	}
}
