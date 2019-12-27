import { KoaMiddleware } from '../../core/koa'
import { Client, Connection } from '@contember/database'

class DatabaseTransactionMiddlewareFactory {
	public create(): KoaMiddleware<DatabaseTransactionMiddlewareFactory.KoaState> {
		const databaseTransaction: KoaMiddleware<DatabaseTransactionMiddlewareFactory.KoaState> = async (ctx, next) => {
			await ctx.state.db.transaction(async db => {
				await db.query(Connection.REPEATABLE_READ)

				ctx.state.db = db
				let planRollback = false
				ctx.state.planRollback = () => (planRollback = true)
				await next()
				if (planRollback) {
					await db.connection.rollback()
				}
			})
		}
		return databaseTransaction
	}
}

namespace DatabaseTransactionMiddlewareFactory {
	export interface KoaState {
		db: Client
		planRollback: () => void
	}

	export class RollbackMarker {}
}

export { DatabaseTransactionMiddlewareFactory }
