import { KoaMiddleware } from '../core/koa/types'
import KnexWrapper from '../core/knex/KnexWrapper'

class DatabaseTransactionMiddlewareFactory {
	public create(): KoaMiddleware<DatabaseTransactionMiddlewareFactory.KoaState> {
		const databaseTransaction: KoaMiddleware<DatabaseTransactionMiddlewareFactory.KoaState> = async (ctx, next) => {
			try {
				await ctx.state.db.transaction(async db => {
					await db.raw('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ')

					ctx.state.db = db
					let rollback = false
					ctx.state.planRollback = () => (rollback = true)
					await next()
					if (rollback) {
						throw new DatabaseTransactionMiddlewareFactory.RollbackMarker()
					}
				})
			} catch (e) {
				if (!(e instanceof DatabaseTransactionMiddlewareFactory.RollbackMarker)) {
					throw e
				}
			}
		}
		return databaseTransaction
	}
}

namespace DatabaseTransactionMiddlewareFactory {
	export interface KoaState {
		db: KnexWrapper
		planRollback: () => void
	}

	export class RollbackMarker {}
}

export default DatabaseTransactionMiddlewareFactory
