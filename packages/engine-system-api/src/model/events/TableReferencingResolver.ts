import { Model } from '@contember/schema'
import { acceptEveryFieldVisitor } from '@contember/schema-utils'

export class TableReferencingResolver {
	public getTableReferencing(schema: Model.Schema): TableReferencingResolverResult {
		const result: TableReferencingResolverResult = {}

		for (let entity of Object.values(schema.entities)) {
			const referencing = acceptEveryFieldVisitor(
				schema,
				entity,
				new (class implements Model.RelationByTypeVisitor<{ [column: string]: string }> {
					visitManyHasOne({}, relation: Model.ManyHasOneRelation, targetEntity: Model.Entity) {
						return { [relation.joiningColumn.columnName]: targetEntity.tableName }
					}

					visitOneHasOneOwner({}, relation: Model.OneHasOneOwnerRelation, targetEntity: Model.Entity) {
						return { [relation.joiningColumn.columnName]: targetEntity.tableName }
					}

					visitManyHasManyOwner(
						entity: Model.Entity,
						relation: Model.ManyHasManyOwnerRelation,
						targetEntity: Model.Entity,
					) {
						return {
							[relation.joiningTable.joiningColumn.columnName]: entity.tableName,
							[relation.joiningTable.inverseJoiningColumn.columnName]: targetEntity.tableName,
						}
					}

					visitColumn() {
						return {}
					}

					visitManyHasManyInversed() {
						return {}
					}

					visitOneHasMany() {
						return {}
					}

					visitOneHasOneInversed() {
						return {}
					}
				})(),
			)
			result[entity.tableName] = Object.values(referencing).reduce((acc, val) => ({ ...acc, ...val }), {})
		}
		return result
	}
}

export type TableReferencingResolverResult = { [tableName: string]: { [column: string]: string } }
