import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { getColumnName } from '@contember/schema-utils'

class MakeRelationNullableModification implements Modification<MakeRelationNullableModification.Data> {
	constructor(private readonly data: MakeRelationNullableModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		const columnName = getColumnName(this.schema.model, entity, this.data.fieldName)
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
}

namespace MakeRelationNullableModification {
	export const id = 'makeRelationNullable'

	export interface Data {
		entityName: string
		fieldName: string
	}
}

export default MakeRelationNullableModification
