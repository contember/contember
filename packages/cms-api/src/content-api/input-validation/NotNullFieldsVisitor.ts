import { Model } from 'cms-common'

export default class NotNullFieldsVisitor
	implements Model.RelationByTypeVisitor<boolean>, Model.ColumnVisitor<boolean> {
	visitColumn(entity: Model.Entity, column: Model.AnyColumn): boolean {
		return !column.nullable
	}

	visitManyHasManyInversed(): boolean {
		return false
	}

	visitManyHasManyOwner(): boolean {
		return false
	}

	visitManyHasOne(entity: Model.Entity, relation: Model.ManyHasOneRelation): boolean {
		return !relation.nullable
	}

	visitOneHasMany(): boolean {
		return false
	}

	visitOneHasOneInversed(entity: Model.Entity, relation: Model.OneHasOneInversedRelation): boolean {
		return !relation.nullable
	}

	visitOneHasOneOwner(entity: Model.Entity, relation: Model.OneHasOneOwnerRelation): boolean {
		return !relation.nullable
	}
}
