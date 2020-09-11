import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { getColumnName, getEntity, ModelError, ModelErrorCode } from '@contember/schema-utils'

class MakeRelationNullableModification implements Modification<MakeRelationNullableModification.Data> {
	constructor(private readonly data: MakeRelationNullableModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		try {
			const entity = getEntity(this.schema.model, this.data.entityName)
			const columnName = getColumnName(this.schema.model, entity, this.data.fieldName)
			builder.alterColumn(entity.tableName, columnName, {
				notNull: false,
			})
		} catch (e) {
			if (e instanceof ModelError && e.code === ModelErrorCode.NOT_OWNING_SIDE) {
				return
			}
		}
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
}

namespace MakeRelationNullableModification {
	export const id = 'makeRelationNullable'

	export interface Data {
		entityName: string
		fieldName: string
	}
}

export default MakeRelationNullableModification
