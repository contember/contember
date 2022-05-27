import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { getEntity, tryGetColumnName } from '@contember/schema-utils'
import { isIt } from '../../utils/isIt'
import { updateRelations } from '../utils/diffUtils'

export class MakeRelationNullableModificationHandler implements ModificationHandler<MakeRelationNullableModificationData> {
	constructor(protected readonly data: MakeRelationNullableModificationData, protected readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = getEntity(this.schema.model, this.data.entityName)
		if (entity.view) {
			return
		}
		const columnName = tryGetColumnName(this.schema.model, entity, this.data.fieldName)
		if (!columnName) {
			return
		}
		builder.alterColumn(entity.tableName, columnName, {
			notNull: false,
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.AnyRelation & Model.NullableRelation>(fieldName, ({ field }) => ({
					...field,
					nullable: true,
				})),
			),
		)
	}

	describe() {
		return {
			message: `Make relation ${this.data.entityName}.${this.data.fieldName} nullable`,
		}
	}

}

export interface MakeRelationNullableModificationData {
	entityName: string
	fieldName: string
}


export const makeRelationNullableModification = createModificationType({
	id: 'makeRelationNullable',
	handler: MakeRelationNullableModificationHandler,
})

export class MakeRelationNullableDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			if (
				originalRelation.type === updatedRelation.type &&
				isIt<Model.NullableRelation>(updatedRelation, 'nullable') &&
				isIt<Model.NullableRelation>(originalRelation, 'nullable') &&
				updatedRelation.nullable &&
				!originalRelation.nullable
			) {
				return makeRelationNullableModification.createModification({
					entityName: updatedEntity.name,
					fieldName: updatedRelation.name,
				})
			}
			return undefined
		})
	}
}
