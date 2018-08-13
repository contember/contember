import * as Knex from 'knex'
import Path from './Path'
import { acceptFieldVisitor, acceptRelationTypeVisitor } from '../../../content-schema/modelUtils'
import { Model } from 'cms-common'
import JoinVisitor from './JoinVisitor'

export default class JoinBuilder {
	constructor(private readonly schema: Model.Schema) {}

	join(qb: Knex.QueryBuilder, path: Path, entity: Model.Entity, relationName: string): Path {
		const joins = acceptRelationTypeVisitor(this.schema, entity, relationName, new JoinVisitor(path))

		for (let join of joins) {
			const sourceAlias = join.sourceAlias || path.back().getAlias()
			const targetAlias = join.targetAlias || path.getAlias()
			qb.leftJoin(
				`${join.tableName} as ${targetAlias}`,
				`${sourceAlias}.${join.sourceColumn}`,
				`${targetAlias}.${join.targetColumn}`
			)
		}

		const targetEntity = acceptFieldVisitor(this.schema, entity, relationName, {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: (_a, _b, targetEntity) => targetEntity
		})

		const primaryPath = path.for(targetEntity.primary)
		qb.select(`${path.getAlias()}.${targetEntity.primaryColumn} as ${primaryPath.getAlias()}`)

		return primaryPath
	}
}
