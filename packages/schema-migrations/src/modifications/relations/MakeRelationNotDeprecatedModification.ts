import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { isIt } from '../../utils/isIt'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { updateRelations } from '../utils/diffUtils'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'

export class MakeRelationNotDeprecatedModificationHandler implements ModificationHandler<MakeRelationNotDeprecatedModificationData> {
	constructor(private readonly data: MakeRelationNotDeprecatedModificationData) { }

	public createSql(_builder: MigrationBuilder): void {
		// Deprecation is a schema-level concept and doesn't require SQL changes
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.AnyRelation>(fieldName, ({ field }) => {
					const updatedField = { ...field }
					delete (updatedField as any).deprecationReason
					return updatedField
				}),
			),
		)
	}

	describe() {
		return {
			message: `Make relation ${this.data.entityName}.${this.data.fieldName} not deprecated`,
		}
	}

}

export interface MakeRelationNotDeprecatedModificationData {
	entityName: string
	fieldName: string
}


export const makeRelationNotDeprecatedModification = createModificationType({
	id: 'makeRelationNotDeprecated',
	handler: MakeRelationNotDeprecatedModificationHandler,
})

export class MakeRelationNotDeprecatedDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			if (
				originalRelation.type === updatedRelation.type &&
				isIt<Model.DeprecatedRelation>(originalRelation, 'deprecationReason') &&
				!isIt<Model.DeprecatedRelation>(updatedRelation, 'deprecationReason') &&
				originalRelation.deprecationReason !== undefined
			) {
				return makeRelationNotDeprecatedModification.createModification({
					entityName: updatedEntity.name,
					fieldName: originalRelation.name,
				})
			}

			return undefined
		})
	}
}
