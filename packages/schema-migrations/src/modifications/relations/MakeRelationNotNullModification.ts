import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { getEntity, tryGetColumnName } from '@contember/schema-utils'
import { isIt } from '../../utils/isIt'
import { updateRelations } from '../utils/diffUtils'

export class MakeRelationNotNullModificationHandler implements ModificationHandler<MakeRelationNotNullModificationData> {
	constructor(protected readonly data: MakeRelationNotNullModificationData, protected readonly schema: Schema) {}

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
			notNull: true,
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.AnyRelation & Model.NullableRelation>(fieldName, ({ field }) => ({
					...field,
					nullable: false,
				})),
			),
		)
	}

	describe() {
		return {
			message: `Make relation ${this.data.entityName}.${this.data.fieldName} not-nullable`,
			failureWarning: 'Changing to not-null may fail in runtime',
		}
	}
}

export interface MakeRelationNotNullModificationData {
	entityName: string
	fieldName: string
	// todo fillValue
}

export const makeRelationNotNullModification = createModificationType({
	id: 'makeRelationNotNull',
	handler: MakeRelationNotNullModificationHandler,
})

export class MakeRelationNotNullDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			if (
				originalRelation.type === updatedRelation.type &&
				isIt<Model.NullableRelation>(updatedRelation, 'nullable') &&
				isIt<Model.NullableRelation>(originalRelation, 'nullable') &&
				!updatedRelation.nullable &&
				originalRelation.nullable
			) {
				return makeRelationNotNullModification.createModification({
					entityName: updatedEntity.name,
					fieldName: updatedRelation.name,
				})
			}
			return undefined
		})
	}
}
