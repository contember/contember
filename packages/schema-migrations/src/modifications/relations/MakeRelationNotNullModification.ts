import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { getColumnName, getEntity, ModelError, ModelErrorCode } from '@contember/schema-utils'

class MakeRelationNotNullModification implements Modification<MakeRelationNotNullModification.Data> {
	constructor(private readonly data: MakeRelationNotNullModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		try {
			const entity = getEntity(this.schema.model, this.data.entityName)
			const columnName = getColumnName(this.schema.model, entity, this.data.fieldName)
			builder.alterColumn(entity.tableName, columnName, {
				notNull: true,
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
					nullable: false,
				})),
			),
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return {
			message: `Make relation ${this.data.entityName}.${this.data.fieldName} not-nullable`,
			failureWarning: 'Changing to not-null may fail in runtime',
		}
	}
}

namespace MakeRelationNotNullModification {
	export const id = 'makeRelationNotNull'

	export interface Data {
		entityName: string
		fieldName: string
		// todo fillValue
	}
}

export default MakeRelationNotNullModification
