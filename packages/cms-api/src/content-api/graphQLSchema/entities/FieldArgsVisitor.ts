import { Model } from 'cms-common'
import WhereTypeProvider from '../WhereTypeProvider'
import { GraphQLFieldConfigArgumentMap } from 'graphql/type/definition'

export default class FieldArgsVisitor
	implements
		Model.ColumnVisitor<GraphQLFieldConfigArgumentMap | undefined>,
		Model.RelationByTypeVisitor<GraphQLFieldConfigArgumentMap | undefined> {
	private whereTypeProvider: WhereTypeProvider

	constructor(whereTypeProvider: WhereTypeProvider) {
		this.whereTypeProvider = whereTypeProvider
	}

	public visitManyHasManyInversed(
		entity: Model.Entity,
		relation: Model.ManyHasManyInversedRelation,
		targetEntity: Model.Entity
	) {
		return this.getHasManyArgs(relation, targetEntity)
	}

	public visitManyHasManyOwner(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		targetEntity: Model.Entity
	) {
		return this.getHasManyArgs(relation, targetEntity)
	}

	public visitOneHasMany(entity: Model.Entity, relation: Model.OneHasManyRelation, targetEntity: Model.Entity) {
		return this.getHasManyArgs(relation, targetEntity)
	}

	private getHasManyArgs(relation: Model.Relation, targetEntity: Model.Entity) {
		return {
			where: { type: this.whereTypeProvider.getEntityWhereType(relation.target) }
		}
	}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn) {
		return undefined
	}

	public visitManyHasOne() {
		return undefined
	}

	public visitOneHasOneInversed() {
		return undefined
	}

	public visitOneHasOneOwner() {
		return undefined
	}
}
