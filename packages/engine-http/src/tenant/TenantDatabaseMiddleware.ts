import { DatabaseContext, DatabaseContextProvider } from '@contember/engine-tenant-api'
import { KoaMiddleware } from '../koa'

export interface TenantDatabaseMiddlewareState {
	tenantDatabase: DatabaseContext
}

export class TenantDatabaseMiddlewareFactory {
	constructor(
		private databaseContextProvider: DatabaseContextProvider,
	) {
	}

	create(): KoaMiddleware<TenantDatabaseMiddlewareState> {
		const tenantDatabase: KoaMiddleware<TenantDatabaseMiddlewareState> = (ctx, next) => {
			ctx.state.tenantDatabase = this.databaseContextProvider.get()
			return next()
		}
		return tenantDatabase
	}
}
