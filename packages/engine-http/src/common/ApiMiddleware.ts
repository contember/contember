import { compose, KoaMiddleware } from '../koa'
import { createModuleInfoMiddleware } from './ModuleInfoMiddleware'
import corsMiddleware from '@koa/cors'
import { AuthMiddlewareFactory } from './AuthMiddleware'
import { TenantDatabaseMiddlewareFactory } from '../tenant'

type KoaState = unknown

export class ApiMiddlewareFactory {
	constructor(
		private readonly tenantDatabaseMiddlewareFactory: TenantDatabaseMiddlewareFactory,
		private readonly authMiddlewareFactory: AuthMiddlewareFactory,
	) {
	}

	public create(module: string): KoaMiddleware<KoaState> {
		return compose([
			this.tenantDatabaseMiddlewareFactory.create(),
			createModuleInfoMiddleware(module),
			corsMiddleware(),
			this.authMiddlewareFactory.create(),
		])
	}
}
