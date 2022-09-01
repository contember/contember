import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { isIt } from '../../utils/isIt'
import { updateRelations } from '../utils/diffUtils'

export class UpdateRelationOnDeleteModificationHandler implements ModificationHandler<UpdateRelationOnDeleteModificationData> {
	constructor(private readonly data: UpdateRelationOnDeleteModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName, onDelete } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.AnyRelation & Model.JoiningColumnRelation>(fieldName, ({ field }) => ({
					...field,
					joiningColumn: { ...field.joiningColumn, onDelete },
				})),
			),
		)
	}

	describe() {
		return { message: `Change on-delete policy of relation ${this.data.entityName}.${this.data.fieldName}` }
	}
}

export interface UpdateRelationOnDeleteModificationData {
	entityName: string
	fieldName: string
	onDelete: Model.OnDelete
}

export const updateRelationOnDeleteModification = createModificationType({
	id: 'updateRelationOnDelete',
	handler: UpdateRelationOnDeleteModificationHandler,
})

export class UpdateRelationOnDeleteDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			if (
				originalRelation.type === updatedRelation.type &&
				isIt<Model.JoiningColumnRelation>(updatedRelation, 'joiningColumn') &&
				isIt<Model.JoiningColumnRelation>(originalRelation, 'joiningColumn') &&
				updatedRelation.joiningColumn.onDelete !== originalRelation.joiningColumn.onDelete
			) {
				return updateRelationOnDeleteModification.createModification({
					entityName: updatedEntity.name,
					fieldName: updatedRelation.name,
					onDelete: updatedRelation.joiningColumn.onDelete,
				})
			}
			return undefined
		})
	}
}
