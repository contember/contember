import { Input, Model } from '@contember/schema'
import Path from './Path'
import JoinBuilder from './JoinBuilder'
import { QueryBuilder } from '@contember/database'
import { getColumnName, getTargetEntity } from '@contember/schema-utils'
import { SelectBuilder } from '@contember/database'
import { UserError } from '../../exception'

class OrderByBuilder {
	constructor(private readonly schema: Model.Schema, private readonly joinBuilder: JoinBuilder) {}

	public build<Orderable extends QueryBuilder.Orderable<any> | null>(
		qb: SelectBuilder<SelectBuilder.Result>,
		orderable: Orderable,
		entity: Model.Entity,
		path: Path,
		orderBy: Input.OrderBy[],
	): [SelectBuilder<SelectBuilder.Result>, Orderable] {
		return orderBy.reduce<[SelectBuilder<SelectBuilder.Result>, Orderable]>(
			([qb, orderable], fieldOrderBy) => this.buildOne(qb, orderable, entity, path, fieldOrderBy),
			[qb, orderable],
		)
	}

	private buildOne<Orderable extends QueryBuilder.Orderable<any> | null>(
		qb: SelectBuilder<SelectBuilder.Result>,
		orderable: Orderable,
		entity: Model.Entity,
		path: Path,
		orderBy: Input.OrderBy,
	): [SelectBuilder<SelectBuilder.Result>, Orderable] {
		const entries = Object.entries(orderBy)
		if (entries.length !== 1) {
			const fields = entries.join(', ')
			throw new UserError('Order by: only one field is expected in each item of order by clause, got: ' + fields)
		}
		const [fieldName, value]: [string, Input.FieldOrderBy] = entries[0]

		if (typeof value === 'string') {
			const columnName = getColumnName(this.schema, entity, fieldName)
			const applyOrder = <Orderable extends QueryBuilder.Orderable<any>>(orderable: Orderable) =>
				orderable.orderBy([path.getAlias(), columnName], value as Input.OrderDirection)

			qb = applyOrder(qb)
			if (orderable !== null) {
				orderable = applyOrder(orderable as QueryBuilder.Orderable<any>)
			}
			return [qb, orderable]
		} else {
			const targetEntity = getTargetEntity(this.schema, entity, fieldName)
			if (!targetEntity) {
				throw new Error(`OrderByBuilder: target entity for relation ${entity.name}::${fieldName} not found`)
			}
			const newPath = path.for(fieldName)
			const joined = this.joinBuilder.join(qb, newPath, entity, fieldName)

			return this.buildOne(joined, orderable, targetEntity, newPath, value)
		}
	}
}

export default OrderByBuilder
