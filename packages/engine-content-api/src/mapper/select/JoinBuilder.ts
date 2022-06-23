import { Path } from './Path.js'
import { acceptRelationTypeVisitor, getTargetEntity } from '@contember/schema-utils'
import { Model } from '@contember/schema'
import { JoinVisitor } from './JoinVisitor.js'
import { Operator, SelectBuilder } from '@contember/database'

export class JoinBuilder {
	constructor(private readonly schema: Model.Schema) {}

	join<Filled extends keyof SelectBuilder.Options>(
		qb: SelectBuilder<SelectBuilder.Result>,
		path: Path,
		entity: Model.Entity,
		relationName: string,
	) {
		const targetEntity = getTargetEntity(this.schema, entity, relationName)
		if (!targetEntity) {
			throw new Error(`JoinBuilder: target entity for relation ${entity.name}::${relationName} not found`)
		}

		const joins = acceptRelationTypeVisitor(this.schema, entity, relationName, new JoinVisitor(path))

		return joins.reduce<SelectBuilder<SelectBuilder.Result>>((qb, join) => {
			const targetAlias = join.targetAlias || path.alias
			if (qb.options.join.find(it => it.alias === targetAlias)) {
				return qb
			}
			const sourceAlias = join.sourceAlias || path.back().alias

			return qb.leftJoin(join.tableName, targetAlias, clause =>
				clause.compareColumns([sourceAlias, join.sourceColumn], Operator.eq, [targetAlias, join.targetColumn]),
			)
		}, qb)
	}
}
