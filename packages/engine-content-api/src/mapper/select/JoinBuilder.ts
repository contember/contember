import { Path } from './Path.js'
import { acceptRelationTypeVisitor, getTargetEntity } from '@contember/schema-utils'
import { Model } from '@contember/schema'
import { JoinVisitor } from './JoinVisitor.js'
import { Literal, Operator, SelectBuilder } from '@contember/database'

export class JoinBuilder {
	constructor(private readonly schema: Model.Schema) {}

	join<R extends SelectBuilder.Result>(
		qb: SelectBuilder<R>,
		path: Path,
		entity: Model.Entity,
		relationName: string,
		targetSource?: Literal,
	): SelectBuilder<R> {
		const targetEntity = getTargetEntity(this.schema, entity, relationName)
		if (!targetEntity) {
			throw new Error(`JoinBuilder: target entity for relation ${entity.name}::${relationName} not found`)
		}

		const joins = acceptRelationTypeVisitor(this.schema, entity, relationName, new JoinVisitor(path))

		return joins.reduce<SelectBuilder<R>>((qb, join) => {
			const targetAlias = join.targetAlias || path.alias
			if (qb.options.join.find(it => it.alias === targetAlias)) {
				return qb
			}
			const sourceAlias = join.sourceAlias || path.back().alias

			// The relation target may be a guarded source (a derived table restricted to readable rows).
			const source = targetSource !== undefined && targetAlias === path.alias ? targetSource : join.tableName
			return qb.leftJoin(
				source,
				targetAlias,
				clause => clause.compareColumns([sourceAlias, join.sourceColumn], Operator.eq, [targetAlias, join.targetColumn]),
			)
		}, qb)
	}
}
