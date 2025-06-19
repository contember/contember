import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { updateRelations } from '../utils/diffUtils'
import { isIt } from '../../utils/isIt'

export class MakeRelationDeprecatedModificationHandler implements ModificationHandler<MakeRelationDeprecatedModificationData> {
	constructor(private readonly data: MakeRelationDeprecatedModificationData) {}

	public createSql(_builder: MigrationBuilder): void {
		// Deprecation is a schema-level concept and doesn't require SQL changes
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName, deprecationReason } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.AnyRelation>(fieldName, ({ field }) => {
					const updatedField = { ...field }
					if (deprecationReason === undefined) {
						delete (updatedField as any).deprecationReason
					} else {
						(updatedField as any).deprecationReason = deprecationReason
					}
					return updatedField
				}),
			),
		)
	}

	describe() {
		const action = this.data.deprecationReason ? 'deprecated' : 'not deprecated'
		const reason = this.data.deprecationReason ? `: ${this.data.deprecationReason}` : ''
		return {
			message: `Make relation ${this.data.entityName}.${this.data.fieldName} ${action}${reason}`,
		}
	}

}

export interface MakeRelationDeprecatedModificationData {
	entityName: string
	fieldName: string
	deprecationReason?: string
}


export const makeRelationDeprecatedModification = createModificationType({
	id: 'makeRelationDeprecated',
	handler: MakeRelationDeprecatedModificationHandler,
})

export class MakeRelationDeprecatedDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {

			if (
				originalRelation.type === updatedRelation.type &&
				isIt<Model.DeprecatedRelation>(updatedRelation, 'deprecationReason') &&
				!isIt<Model.DeprecatedRelation>(originalRelation, 'deprecationReason') &&
				updatedRelation.deprecationReason !== undefined
			) {
				return makeRelationDeprecatedModification.createModification({
					entityName: updatedEntity.name,
					fieldName: updatedRelation.name,
					deprecationReason: updatedRelation.deprecationReason,
				})
			}

			return undefined
		})
	}
}
