import corsMiddleware from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import { compose, route } from '../koa'
import { createProjectMemberMiddleware, createProjectResolveMiddleware } from '../project-common'
import { createAuthMiddleware, createModuleInfoMiddleware } from '../common'
import { createSystemServerMiddleware } from './SystemServerMiddleware'

export const createSystemMiddleware = () => {
	return route(
		'/system/:projectSlug$',
		compose([
			createModuleInfoMiddleware('system'),
			corsMiddleware(),
			bodyParser(),
			createAuthMiddleware(),
			createProjectResolveMiddleware(),
			createProjectMemberMiddleware(),
			createSystemServerMiddleware(),
		]),
	)
}
