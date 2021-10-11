import { compose, KoaMiddleware } from '../koa'
import { createModuleInfoMiddleware } from './ModuleInfoMiddleware'
import corsMiddleware from '@koa/cors'
import { AuthMiddlewareFactory } from './AuthMiddleware'

type KoaState = unknown

export class ApiMiddlewareFactory {
	constructor(
		private readonly authMiddlewareFactory: AuthMiddlewareFactory,
	) {
	}

	public create(module: string): KoaMiddleware<KoaState> {
		return compose([
			createModuleInfoMiddleware(module),
			corsMiddleware(),
			this.authMiddlewareFactory.create(),
		])
	}
}
