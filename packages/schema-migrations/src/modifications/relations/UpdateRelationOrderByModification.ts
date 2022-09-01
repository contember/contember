import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'
import { updateRelations } from '../utils/diffUtils'

export class UpdateRelationOrderByModificationHandler implements ModificationHandler<UpdateRelationOrderByModificationData> {

	constructor(private readonly data: UpdateRelationOrderByModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName, orderBy } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.AnyRelation & Model.OrderableRelation>(fieldName, ({ field }) => ({
					...field,
					orderBy,
				})),
			),
		)
	}

	describe() {
		return { message: `Update order-by of relation ${this.data.entityName}.${this.data.fieldName}` }
	}
}

export interface UpdateRelationOrderByModificationData {
	entityName: string
	fieldName: string
	orderBy: readonly Model.OrderBy[]
}

export const updateRelationOrderByModification = createModificationType({
	id: 'updateRelationOrderBy',
	handler: UpdateRelationOrderByModificationHandler,
})

export class UpdateRelationOrderByDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ updatedRelation, originalRelation, updatedEntity }) => {
			const isItOrderable = (relation: Model.AnyRelation): relation is Model.OrderableRelation & Model.AnyRelation =>
				relation.type === Model.RelationType.ManyHasMany || relation.type === Model.RelationType.OneHasMany
			if (
				updatedRelation.type === originalRelation.type &&
				isItOrderable(updatedRelation) &&
				isItOrderable(originalRelation) &&
				!deepEqual(updatedRelation.orderBy || [], originalRelation.orderBy || [])
			) {
				return updateRelationOrderByModification.createModification({
					entityName: updatedEntity.name,
					fieldName: updatedRelation.name,
					orderBy: updatedRelation.orderBy || [],
				})
			}
			return undefined
		})
	}
}
