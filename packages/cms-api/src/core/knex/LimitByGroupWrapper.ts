import QueryBuilder from './QueryBuilder'
import WindowFunction from './WindowFunction'
import ConditionBuilder from './ConditionBuilder'

class LimitByGroupWrapper {
	constructor(
		private readonly groupBy: QueryBuilder.ColumnIdentifier,
		private readonly orderByCallback: ((orderable: QueryBuilder.Orderable, qb: QueryBuilder<any>) => void) | undefined,
		private readonly skip: number | undefined,
		private readonly limit: number | undefined
	) {}

	public async getResult<R>(qb: QueryBuilder<R>): Promise<R> {
		if (this.limit !== undefined || this.skip !== undefined) {
			qb.select(
				expr =>
					expr.window(window => {
						window = window.rowNumber().partitionBy(this.groupBy)
						if (this.orderByCallback !== undefined) {
							const mutableWrapper = new WindowFunction.MutableWindowFunctionOrderableWrapper(window)
							this.orderByCallback(mutableWrapper, qb)
							window = mutableWrapper.getWindowFunction()
						}

						return window
					}),
				'rowNumber_'
			)

			/*
			> Currently, window functions always require presorted data, and so the query output
			> will be ordered according to one or another of the window functions' PARTITION BY/ORDER BY clauses.
			> **It is not recommended to rely on this**, however. Use an explicit top-level ORDER BY clause
			> if you want to be sure the results are sorted in a particular way.
			https://www.postgresql.org/docs/10/static/queries-table-expressions.html#QUERIES-WINDOW
			 */
			if (this.orderByCallback) {
				this.orderByCallback(qb, qb)
			}

			const wrapperQb = qb.wrapper.queryBuilder<R>()
			wrapperQb.with('data', qb)
			wrapperQb.select(['data', '*'])
			const start = this.skip || 0

			if (start > 0) {
				wrapperQb.where(expr => expr.compare(['data', 'rowNumber_'], ConditionBuilder.Operator.gt, start))
			}

			const limit = this.limit
			if (limit !== undefined) {
				wrapperQb.where(expr => expr.compare(['data', 'rowNumber_'], ConditionBuilder.Operator.lte, start + limit))
			}
			wrapperQb.from('data')

			return await wrapperQb.getResult()
		} else if (this.orderByCallback) {
			this.orderByCallback(qb, qb)
		}

		return await qb.getResult()
	}
}

export default LimitByGroupWrapper
