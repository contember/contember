import { Literal, SelectBuilder } from '@contember/database'
import { Path } from './Path'
import { Model } from '@contember/schema'
import { ImplementationException } from '../../exception'

export class ComputedFieldBuilder {
	withComputed(
		qb: SelectBuilder,
		entity: Model.Entity,
		column: Model.AnyColumn,
		path: Path,
	) {

		// todo this MUST be validated, risk of invalid SQL injection (you can execute updates here)

		if (!column.computed) {
			throw new ImplementationException()
		}
		// const processedQuery = column.
		// const query = new Literal()
		// // todo: join only once
		// return qb.lateralJoin()
	}
}
