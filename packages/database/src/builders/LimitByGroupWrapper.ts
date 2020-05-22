import { QueryBuilder } from './QueryBuilder'
import { SelectBuilder } from './SelectBuilder'
import { Operator } from './ConditionBuilder'
import { Client } from '../client'

class LimitByGroupWrapper {
	constructor(
		private readonly groupBy: QueryBuilder.ColumnIdentifier,
		private readonly orderByCallback:
			| (<Orderable extends QueryBuilder.Orderable<any>>(
					orderable: Orderable,
					qb: SelectBuilder<any>,
			  ) => [Orderable, SelectBuilder<any>])
			| undefined,
		private readonly skip: number | undefined,
		private readonly limit: number | undefined,
	) {}

	public async getResult<R>(qb: SelectBuilder<R>, db: Client): Promise<R[]> {
		if (this.limit !== undefined || this.skip !== undefined) {
			qb = qb.select(
				expr =>
					expr.window(window => {
						window = window.rowNumber().partitionBy(this.groupBy)
						if (this.orderByCallback !== undefined) {
							;[window, qb] = this.orderByCallback(window, qb)
						}

						return window
					}),
				'rowNumber_',
			)

			/*
			> Currently, window functions always require presorted data, and so the query output
			> will be ordered according to one or another of the window functions' PARTITION BY/ORDER BY clauses.
			> **It is not recommended to rely on this**, however. Use an explicit top-level ORDER BY clause
			> if you want to be sure the results are sorted in a particular way.
			https://www.postgresql.org/docs/10/static/queries-table-expressions.html#QUERIES-WINDOW
			 */
			if (this.orderByCallback) {
				;[qb] = this.orderByCallback(qb, qb)
			}

			let wrapperQb: SelectBuilder<R> = SelectBuilder.create<R>()
				.with('data', qb)
				.from('data')
				.select(['data', '*'])

			const start = this.skip || 0
			if (start > 0) {
				wrapperQb = wrapperQb.where(expr => expr.compare(['data', 'rowNumber_'], Operator.gt, start))
			}

			const limit = this.limit
			if (limit !== undefined) {
				wrapperQb = wrapperQb.where(expr => expr.compare(['data', 'rowNumber_'], Operator.lte, start + limit))
			}

			return await wrapperQb.getResult(db)
		} else if (this.orderByCallback) {
			return await this.orderByCallback(qb, qb)[0].getResult(db)
		}

		return await qb.getResult(db)
	}
}

export { LimitByGroupWrapper }
