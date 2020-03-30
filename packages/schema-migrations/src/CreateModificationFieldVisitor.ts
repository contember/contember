import { Model } from '@contember/schema'
import CreateColumnModification from './modifications/columns/CreateColumnModification'
import CreateRelationModification from './modifications/relations/CreateRelationModification'
import CreateRelationInverseSideModification from './modifications/relations/CreateRelationInverseSideModification'
import { Migration } from './Migration'
import deepCopy from './utils/deepCopy'

export default class CreateFieldVisitor
	implements
		Model.ColumnVisitor<Migration.Modification<any>>,
		Model.RelationByTypeVisitor<Migration.Modification<any>> {
	public visitColumn(
		entity: Model.Entity,
		updatedColumn: Model.AnyColumn,
	): Migration.Modification<CreateColumnModification.Data> {
		return {
			modification: CreateColumnModification.id,
			entityName: entity.name,
			field: deepCopy(updatedColumn),
		}
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

	public visitOneHasOneOwner(
		entity: Model.Entity,
		relation: Model.OneHasOneOwnerRelation,
		{},
		targetRelation: Model.OneHasOneInversedRelation | null,
	): Migration.Modification<CreateRelationModification.Data> {
		return {
			modification: CreateRelationModification.id,
			entityName: entity.name,
			owningSide: relation,
			...(targetRelation ? { inverseSide: targetRelation } : {}),
		}
	}

	public visitOneHasOneInversed(
		entity: Model.Entity,
		relation: Model.OneHasOneInversedRelation,
	): Migration.Modification<CreateRelationInverseSideModification.Data> {
		return {
			modification: CreateRelationInverseSideModification.id,
			entityName: entity.name,
			relation: relation,
		}
	}

	public visitManyHasManyOwner(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		{},
		targetRelation: Model.ManyHasManyInversedRelation | null,
	): Migration.Modification<CreateRelationModification.Data> {
		return {
			modification: CreateRelationModification.id,
			entityName: entity.name,
			owningSide: relation,
			...(targetRelation ? { inverseSide: targetRelation } : {}),
		}
	}

	public visitManyHasManyInversed(
		entity: Model.Entity,
		relation: Model.ManyHasManyInversedRelation,
	): Migration.Modification<CreateRelationInverseSideModification.Data> {
		return {
			modification: CreateRelationInverseSideModification.id,
			entityName: entity.name,
			relation: relation,
		}
	}
}
