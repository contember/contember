import koaCompose from 'koa-compose'
import corsMiddleware from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import { KoaContext, route } from '../../core/koa'
import { createProjectMemberMiddleware, createProjectResolveMiddleware } from '../project-common'
import { createAuthMiddleware } from '../common'
import { createSystemServerMiddleware } from './SystemServerMiddleware'

export const createSystemMiddleware = () => {
	return route(
		'/system/:projectSlug$',
		koaCompose<KoaContext<any>>([
			corsMiddleware(),
			bodyParser(),
			createAuthMiddleware(),
			createProjectResolveMiddleware(),
			createProjectMemberMiddleware(),
			createSystemServerMiddleware(),
		]),
	)
}
