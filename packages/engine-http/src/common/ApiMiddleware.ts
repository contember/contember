import { compose, KoaMiddleware } from '../koa'
import { createModuleInfoMiddleware } from './ModuleInfoMiddleware'
import corsMiddleware from '@koa/cors'
import { AuthMiddlewareFactory } from './AuthMiddleware'
import { ProjectGroupMiddlewareFactory } from '../project-common'

type KoaState = unknown

export class ApiMiddlewareFactory {
	constructor(
		private readonly projectGroupMiddlewareFactory: ProjectGroupMiddlewareFactory,
		private readonly authMiddlewareFactory: AuthMiddlewareFactory,
	) {
	}

	public create(module: string): KoaMiddleware<KoaState> {
		return compose([
			this.projectGroupMiddlewareFactory.create(),
			createModuleInfoMiddleware(module),
			corsMiddleware(),
			this.authMiddlewareFactory.create(),
		])
	}
}
