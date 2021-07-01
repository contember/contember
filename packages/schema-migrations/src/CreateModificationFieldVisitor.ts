import { Model } from '@contember/schema'
import CreateColumnModification from './modifications/columns/CreateColumnModification'
import CreateRelationModification from './modifications/relations/CreateRelationModification'
import CreateRelationInverseSideModification from './modifications/relations/CreateRelationInverseSideModification'
import { Migration } from './Migration'
import deepCopy from './utils/deepCopy'

export default class CreateFieldVisitor
	implements Model.ColumnVisitor<Migration.Modification<any>>, Model.RelationByTypeVisitor<Migration.Modification<any>>
{
	public visitColumn(
		entity: Model.Entity,
		updatedColumn: Model.AnyColumn,
	): Migration.Modification<CreateColumnModification.Data> {
		const createColumn: Migration.Modification<CreateColumnModification.Data> = {
			modification: CreateColumnModification.id,
			entityName: entity.name,
			field: deepCopy(updatedColumn),
		}
		if (updatedColumn.default !== undefined) {
			createColumn.fillValue = updatedColumn.default
		}
		return createColumn
	}

	public visitManyHasOne(
		entity: Model.Entity,
		relation: Model.ManyHasOneRelation,
		{},
		targetRelation: Model.OneHasManyRelation | null,
	): Migration.Modification<CreateRelationModification.Data> {
		return {
			modification: CreateRelationModification.id,
			entityName: entity.name,
			owningSide: relation,
			...(targetRelation ? { inverseSide: targetRelation } : {}),
		}
	}

	public visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
	): Migration.Modification<CreateRelationInverseSideModification.Data> {
		return {
			modification: CreateRelationInverseSideModification.id,
			entityName: entity.name,
			relation: relation,
		}
	}

	public visitOneHasOneOwning(
		entity: Model.Entity,
		relation: Model.OneHasOneOwningRelation,
		{},
		targetRelation: Model.OneHasOneInverseRelation | null,
	): Migration.Modification<CreateRelationModification.Data> {
		return {
			modification: CreateRelationModification.id,
			entityName: entity.name,
			owningSide: relation,
			...(targetRelation ? { inverseSide: targetRelation } : {}),
		}
	}

	public visitOneHasOneInverse(
		entity: Model.Entity,
		relation: Model.OneHasOneInverseRelation,
	): Migration.Modification<CreateRelationInverseSideModification.Data> {
		return {
			modification: CreateRelationInverseSideModification.id,
			entityName: entity.name,
			relation: relation,
		}
	}

	public visitManyHasManyOwning(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		{},
		targetRelation: Model.ManyHasManyInverseRelation | null,
	): Migration.Modification<CreateRelationModification.Data> {
		return {
			modification: CreateRelationModification.id,
			entityName: entity.name,
			owningSide: relation,
			...(targetRelation ? { inverseSide: targetRelation } : {}),
		}
	}

	public visitManyHasManyInverse(
		entity: Model.Entity,
		relation: Model.ManyHasManyInverseRelation,
	): Migration.Modification<CreateRelationInverseSideModification.Data> {
		return {
			modification: CreateRelationInverseSideModification.id,
			entityName: entity.name,
			relation: relation,
		}
	}
}
