import { QueryBuilder } from './QueryBuilder'
import { SelectBuilder } from './SelectBuilder'
import { Operator } from './ConditionBuilder'
import { Client } from '../client'
import { WindowFunction } from './WindowFunction'

type OrderByCallback = <Orderable extends QueryBuilder.Orderable<any> | null>(
	orderable: Orderable,
	qb: SelectBuilder<any>,
) => [Orderable, SelectBuilder<any>]

class LimitByGroupWrapper {
	constructor(
		private readonly groupBy: QueryBuilder.ColumnIdentifier,
		private readonly orderByCallback: OrderByCallback | undefined,
		private readonly skip: number | undefined,
		private readonly limit: number | undefined,
	) {}

	public async getResult<R>(qb: SelectBuilder<R>, db: Client): Promise<R[]> {
		if (this.limit !== undefined || this.skip !== undefined) {
			let window = WindowFunction.createEmpty().rowNumber().partitionBy(this.groupBy)
			if (this.orderByCallback !== undefined) {
				[window, qb] = this.orderByCallback(window, qb)
			}

			qb = qb.select(window.compile(), 'rowNumber_')

			let wrapperQb: SelectBuilder<R> = SelectBuilder.create<R>() //
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
			return await this.orderByCallback(null, qb)[1].getResult(db)
		}

		return await qb.getResult(db)
	}
}

export { LimitByGroupWrapper }
