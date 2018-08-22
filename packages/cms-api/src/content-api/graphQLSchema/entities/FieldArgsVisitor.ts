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
		const where = this.getWhereArg(relation)
		return { where }
	}

	public visitManyHasManyOwner(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		targetEntity: Model.Entity
	) {
		const where = this.getWhereArg(relation)
		return { where }
	}

	public visitOneHasMany(entity: Model.Entity, relation: Model.OneHasManyRelation, targetEntity: Model.Entity) {
		const where = this.getWhereArg(relation)
		return { where }
	}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn) {
		return undefined
	}

	public visitManyHasOne(entity: Model.Entity, relation: Model.ManyHasOneRelation) {
		const where = this.getWhereArg(relation)
		return { where }
	}

	public visitOneHasOneInversed(entity: Model.Entity, relation: Model.OneHasOneInversedRelation) {
		const where = this.getWhereArg(relation)
		return { where }
	}

	public visitOneHasOneOwner(entity: Model.Entity, relation: Model.OneHasOneOwnerRelation) {
		const where = this.getWhereArg(relation)
		return { where }
	}

	private getWhereArg(relation: Model.Relation) {
		return { type: this.whereTypeProvider.getEntityWhereType(relation.target) }
	}
}
