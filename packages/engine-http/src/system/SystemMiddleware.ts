import corsMiddleware from '@koa/cors'

import { compose, route } from '../koa'
import { createProjectMemberMiddleware, createProjectResolveMiddleware } from '../project-common'
import { createAuthMiddleware, createModuleInfoMiddleware } from '../common'
import { SystemGraphQLMiddlewareFactory } from './SystemGraphQLMiddlewareFactory'

export const createSystemMiddleware = (systemGraphQLMiddlewareFactory: SystemGraphQLMiddlewareFactory) => {
	return route(
		'/system/:projectSlug$',
		compose([
			createModuleInfoMiddleware('system'),
			corsMiddleware(),
			createAuthMiddleware(),
			createProjectResolveMiddleware(),
			createProjectMemberMiddleware(),
			systemGraphQLMiddlewareFactory.create(),
		]),
	)
}
