import { Input, Model } from '@contember/schema'
import Path from './Path'
import JoinBuilder from './JoinBuilder'
import QueryBuilder from '../../../core/database/QueryBuilder'
import { getColumnName, getTargetEntity } from '../../../content-schema/modelUtils'
import SelectBuilder from '../../../core/database/SelectBuilder'
import UserError from '../../../core/graphql/UserError'

class OrderByBuilder {
	constructor(private readonly schema: Model.Schema, private readonly joinBuilder: JoinBuilder) {}

	public build<Orderable extends QueryBuilder.Orderable<any>, Filled extends keyof SelectBuilder.Options>(
		qb: SelectBuilder<SelectBuilder.Result, Filled>,
		orderable: Orderable,
		entity: Model.Entity,
		path: Path,
		orderBy: Input.OrderBy[],
	): [SelectBuilder<SelectBuilder.Result, Filled | 'join'>, Orderable] {
		return orderBy.reduce<[SelectBuilder<SelectBuilder.Result, Filled | 'join'>, Orderable]>(
			([qb, orderable], fieldOrderBy) => this.buildOne(qb, orderable, entity, path, fieldOrderBy),
			[qb, orderable],
		)
	}

	private buildOne<Orderable extends QueryBuilder.Orderable<any>, Filled extends keyof SelectBuilder.Options>(
		qb: SelectBuilder<SelectBuilder.Result, Filled>,
		orderable: Orderable,
		entity: Model.Entity,
		path: Path,
		orderBy: Input.FieldOrderBy,
	): [SelectBuilder<SelectBuilder.Result, Filled | 'join'>, Orderable] {
		const entries = Object.entries(orderBy)
		if (entries.length !== 1) {
			const fields = entries.join(', ')
			throw new UserError('Order by: only one field is expected in each item of order by clause, got: ' + fields)
		}
		const [fieldName, value]: [string, Input.FieldOrderBy] = entries[0]

		if (typeof value === 'string') {
			const columnName = getColumnName(this.schema, entity, fieldName)
			const prevOrderable: any = orderable
			orderable = orderable.orderBy([path.getAlias(), columnName], value as Input.OrderDirection)
			if (qb === prevOrderable) {
				qb = (orderable as any) as SelectBuilder
			}
			return [qb, orderable]
		} else {
			const targetEntity = getTargetEntity(this.schema, entity, fieldName)
			if (!targetEntity) {
				throw new Error()
			}
			const newPath = path.for(fieldName)
			const prevQb: any = qb
			const joined = this.joinBuilder.join(qb, newPath, entity, fieldName)
			if (prevQb === orderable) {
				orderable = (joined as any) as Orderable
			}
			return this.buildOne(joined, orderable, targetEntity, newPath, value)
		}
	}
}

export default OrderByBuilder
