import Path from './Path'
import { acceptRelationTypeVisitor, getTargetEntity } from '../../../content-schema/modelUtils'
import { Model } from 'cms-common'
import JoinVisitor from './JoinVisitor'
import ConditionBuilder from '../../../core/database/ConditionBuilder'
import SelectBuilder from '../../../core/database/SelectBuilder'

export default class JoinBuilder {
	constructor(private readonly schema: Model.Schema) {}

	join<Filled extends keyof SelectBuilder.Options>(
		qb: SelectBuilder<SelectBuilder.Result, Filled>,
		path: Path,
		entity: Model.Entity,
		relationName: string
	) {
		const targetEntity = getTargetEntity(this.schema, entity, relationName)
		if (!targetEntity) {
			throw new Error()
		}

		const joins = acceptRelationTypeVisitor(this.schema, entity, relationName, new JoinVisitor(path))

		return joins.reduce<SelectBuilder<SelectBuilder.Result, Filled | 'join'>>((qb, join) => {
			const sourceAlias = join.sourceAlias || path.back().getAlias()
			const targetAlias = join.targetAlias || path.getAlias()

			return qb.leftJoin(join.tableName, targetAlias, clause =>
				clause.compareColumns([sourceAlias, join.sourceColumn], ConditionBuilder.Operator.eq, [
					targetAlias,
					join.targetColumn,
				])
			)
		}, qb)
	}
}
