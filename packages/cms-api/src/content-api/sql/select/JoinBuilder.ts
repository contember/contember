import Path from './Path'
import { acceptRelationTypeVisitor, getTargetEntity } from '../../../content-schema/modelUtils'
import { Model } from 'cms-common'
import JoinVisitor from './JoinVisitor'
import ConditionBuilder from '../../../core/knex/ConditionBuilder'
import SelectBuilder from '../../../core/knex/SelectBuilder'

export default class JoinBuilder {
	constructor(private readonly schema: Model.Schema) {}

	join(qb: SelectBuilder, path: Path, entity: Model.Entity, relationName: string): SelectBuilder {
		const joins = acceptRelationTypeVisitor(this.schema, entity, relationName, new JoinVisitor(path))

		qb = joins.reduce((qb, join) => {
			const sourceAlias = join.sourceAlias || path.back().getAlias()
			const targetAlias = join.targetAlias || path.getAlias()

			return qb.leftJoin(join.tableName, targetAlias, clause =>
				clause.compareColumns([sourceAlias, join.sourceColumn], ConditionBuilder.Operator.eq, [
					targetAlias,
					join.targetColumn,
				])
			)
		}, qb)

		const targetEntity = getTargetEntity(this.schema, entity, relationName)
		if (!targetEntity) {
			throw new Error()
		}

		const primaryPath = path.for(targetEntity.primary)

		return qb.select([path.getAlias(), targetEntity.primaryColumn], primaryPath.getAlias())
	}
}
