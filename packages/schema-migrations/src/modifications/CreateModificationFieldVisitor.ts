import { Model } from '@contember/schema'
import { CreateColumnModification, CreateColumnModificationData } from './columns'
import {
	CreateRelationInverseSideModification,
	CreateRelationInverseSideModificationData,
	CreateRelationModification,
	CreateRelationModificationData,
} from './relations'
import { Migration } from '../Migration'
import deepCopy from '../utils/deepCopy'

export default class CreateFieldVisitor
	implements Model.ColumnVisitor<Migration.Modification<any>>, Model.RelationByTypeVisitor<Migration.Modification<any>>
{
	public visitColumn(
		entity: Model.Entity,
		updatedColumn: Model.AnyColumn,
	): Migration.Modification<CreateColumnModificationData> {
		const createColumn = CreateColumnModification.createModification({
			entityName: entity.name,
			field: deepCopy(updatedColumn),
		})
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
	): Migration.Modification<CreateRelationModificationData> {
		return CreateRelationModification.createModification({
			entityName: entity.name,
			owningSide: relation,
			...(targetRelation ? { inverseSide: targetRelation } : {}),
		})
	}

	public visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
	): Migration.Modification<CreateRelationInverseSideModificationData> {
		return CreateRelationInverseSideModification.createModification({
			entityName: entity.name,
			relation: relation,
		})
	}

	public visitOneHasOneOwning(
		entity: Model.Entity,
		relation: Model.OneHasOneOwningRelation,
		{},
		targetRelation: Model.OneHasOneInverseRelation | null,
	): Migration.Modification<CreateRelationModificationData> {
		return CreateRelationModification.createModification({
			entityName: entity.name,
			owningSide: relation,
			...(targetRelation ? { inverseSide: targetRelation } : {}),
		})
	}

	public visitOneHasOneInverse(
		entity: Model.Entity,
		relation: Model.OneHasOneInverseRelation,
	): Migration.Modification<CreateRelationInverseSideModificationData> {
		return CreateRelationInverseSideModification.createModification({
			entityName: entity.name,
			relation: relation,
		})
	}

	public visitManyHasManyOwning(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		{},
		targetRelation: Model.ManyHasManyInverseRelation | null,
	): Migration.Modification<CreateRelationModificationData> {
		return CreateRelationModification.createModification({
			entityName: entity.name,
			owningSide: relation,
			...(targetRelation ? { inverseSide: targetRelation } : {}),
		})
	}

	public visitManyHasManyInverse(
		entity: Model.Entity,
		relation: Model.ManyHasManyInverseRelation,
	): Migration.Modification<CreateRelationInverseSideModificationData> {
		return CreateRelationInverseSideModification.createModification({
			entityName: entity.name,
			relation: relation,
		})
	}
}
