import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { getEntity, tryGetColumnName } from '@contember/schema-utils'

export const MakeRelationNullableModification: ModificationHandlerStatic<MakeRelationNullableModificationData> = class {
	static id = 'makeRelationNullable'
	constructor(private readonly data: MakeRelationNullableModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = getEntity(this.schema.model, this.data.entityName)
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
				updateField<Model.AnyRelation & Model.NullableRelation>(fieldName, field => ({
					...field,
					nullable: true,
				})),
			),
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return {
			message: `Make relation ${this.data.entityName}.${this.data.fieldName} nullable`,
		}
	}

	static createModification(data: MakeRelationNullableModificationData) {
		return { modification: this.id, ...data }
	}
}

export interface MakeRelationNullableModificationData {
	entityName: string
	fieldName: string
}
