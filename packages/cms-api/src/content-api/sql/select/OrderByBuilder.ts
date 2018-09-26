import { Input, Model } from 'cms-common'
import Path from './Path'
import JoinBuilder from './JoinBuilder'
import QueryBuilder from '../../../core/knex/QueryBuilder'
import { getColumnName, getTargetEntity } from '../../../content-schema/modelUtils'

class OrderByBuilder {
	constructor(private readonly schema: Model.Schema, private readonly joinBuilder: JoinBuilder) {}

	public build(
		qb: QueryBuilder,
		orderable: QueryBuilder.Orderable,
		entity: Model.Entity,
		path: Path,
		orderBy: Input.OrderBy[]
	): void {
		orderBy.forEach(fieldOrderBy => this.buildOne(qb, orderable, entity, path, fieldOrderBy))
	}

	private buildOne(
		qb: QueryBuilder,
		orderable: QueryBuilder.Orderable,
		entity: Model.Entity,
		path: Path,
		orderBy: Input.FieldOrderBy
	) {
		const entries = Object.entries(orderBy)
		if (entries.length !== 1) {
			throw new Error()
		}
		const [fieldName, value]: [string, Input.FieldOrderBy] = entries[0]

		if (typeof value === 'string') {
			const columnName = getColumnName(this.schema, entity, fieldName)
			orderable.orderBy([path.getAlias(), columnName], value as Input.OrderDirection)
		} else {
			const targetEntity = getTargetEntity(this.schema, entity, fieldName)
			if (!targetEntity) {
				throw new Error()
			}
			const newPath = path.for(fieldName)
			this.joinBuilder.join(qb, newPath, entity, fieldName)
			this.buildOne(qb, orderable, targetEntity, newPath, value)
		}
	}
}

export default OrderByBuilder
