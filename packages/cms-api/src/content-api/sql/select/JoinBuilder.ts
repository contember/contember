import Path from './Path'
import { acceptRelationTypeVisitor, getTargetEntity } from '../../../content-schema/modelUtils'
import { Model } from 'cms-common'
import JoinVisitor from './JoinVisitor'
import QueryBuilder from '../../../core/knex/QueryBuilder'
import ConditionBuilder from "../../../core/knex/ConditionBuilder";

export default class JoinBuilder {
	constructor(private readonly schema: Model.Schema) {}

	join(qb: QueryBuilder, path: Path, entity: Model.Entity, relationName: string): Path {
		const joins = acceptRelationTypeVisitor(this.schema, entity, relationName, new JoinVisitor(path))

		for (let join of joins) {
			const sourceAlias = join.sourceAlias || path.back().getAlias()
			const targetAlias = join.targetAlias || path.getAlias()

			qb.leftJoin(join.tableName, targetAlias, clause =>
				clause.compareColumns([sourceAlias, join.sourceColumn], ConditionBuilder.Operator.eq, [targetAlias, join.targetColumn])
			)
		}

		const targetEntity = getTargetEntity(this.schema, entity, relationName)
		if (!targetEntity) {
			throw new Error()
		}

		const primaryPath = path.for(targetEntity.primary)
		qb.select([path.getAlias(), targetEntity.primaryColumn], primaryPath.getAlias())

		return primaryPath
	}
}
