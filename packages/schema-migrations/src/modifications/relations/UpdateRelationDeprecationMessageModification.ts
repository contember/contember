import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { updateRelations } from '../utils/diffUtils'
import { isIt } from '../../utils/isIt'

export class UpdateRelationDeprecationMessageModificationHandler implements ModificationHandler<UpdateRelationDeprecationMessageModificationData> {
	constructor(private readonly data: UpdateRelationDeprecationMessageModificationData) {}

	public createSql(_builder: MigrationBuilder): void {
		// Deprecation is a schema-level concept and doesn't require SQL changes
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName, newDeprecationReason } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.AnyRelation>(fieldName, ({ field }) => {
					const updatedField = { ...field }
					;(updatedField as any).deprecationReason = newDeprecationReason
					return updatedField
				}),
			),
		)
	}

	describe() {
		return {
			message: `Update deprecation message for relation ${this.data.entityName}.${this.data.fieldName} from "${this.data.oldDeprecationReason}" to "${this.data.newDeprecationReason}"`,
		}
	}

}

export interface UpdateRelationDeprecationMessageModificationData {
	entityName: string
	fieldName: string
	oldDeprecationReason: string
	newDeprecationReason: string
}

export const updateRelationDeprecationMessageModification = createModificationType({
	id: 'updateRelationDeprecationMessage',
	handler: UpdateRelationDeprecationMessageModificationHandler,
})

export class UpdateRelationDeprecationMessageDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			// Update deprecation message on already deprecated relation
			if (
				originalRelation.type === updatedRelation.type &&
				isIt<Model.DeprecatedRelation>(originalRelation, 'deprecationReason') &&
				isIt<Model.DeprecatedRelation>(updatedRelation, 'deprecationReason') &&
				originalRelation.deprecationReason !== undefined &&
				updatedRelation.deprecationReason !== undefined &&
				originalRelation.deprecationReason !== updatedRelation.deprecationReason
			) {
				return updateRelationDeprecationMessageModification.createModification({
					entityName: updatedEntity.name,
					fieldName: updatedRelation.name,
					oldDeprecationReason: originalRelation.deprecationReason,
					newDeprecationReason: updatedRelation.deprecationReason,
				})
			}

			return undefined
		})
	}
}
