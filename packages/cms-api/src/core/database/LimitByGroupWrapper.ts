import QueryBuilder from './QueryBuilder'
import ConditionBuilder from './ConditionBuilder'
import SelectBuilder from './SelectBuilder'

class LimitByGroupWrapper {
	constructor(
		private readonly groupBy: QueryBuilder.ColumnIdentifier,
		private readonly orderByCallback:
			| (<Orderable extends QueryBuilder.Orderable<any>>(
					orderable: Orderable,
					qb: SelectBuilder<any, any>,
			  ) => [Orderable, SelectBuilder<any, any>])
			| undefined,
		private readonly skip: number | undefined,
		private readonly limit: number | undefined,
	) {}

	public async getResult<R>(qb: SelectBuilder<R, any>): Promise<R[]> {
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

			let wrapperQb: SelectBuilder<R, any> = qb.wrapper
				.selectBuilder<R>()
				.with('data', qb)
				.from('data')
				.select(['data', '*'])

			const start = this.skip || 0
			if (start > 0) {
				wrapperQb = wrapperQb.where(expr => expr.compare(['data', 'rowNumber_'], ConditionBuilder.Operator.gt, start))
			}

			const limit = this.limit
			if (limit !== undefined) {
				wrapperQb = wrapperQb.where(expr =>
					expr.compare(['data', 'rowNumber_'], ConditionBuilder.Operator.lte, start + limit),
				)
			}

			return await wrapperQb.getResult()
		} else if (this.orderByCallback) {
			;[qb] = this.orderByCallback(qb, qb)
		}

		return await qb.getResult()
	}
}

export default LimitByGroupWrapper
