import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent, EventType } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'

class UpdateColumnNameModification implements Modification<UpdateColumnNameModification.Data> {
	constructor(private readonly data: UpdateColumnNameModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		const field = entity.fields[this.data.fieldName] as Model.AnyColumn
		builder.renameColumn(entity.tableName, field.columnName, this.data.columnName)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(
				this.data.entityName,
				updateField(this.data.fieldName, field => ({ ...field, columnName: this.data.columnName })),
			),
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		const entity = this.schema.model.entities[this.data.entityName]
		const tableName = entity.tableName
		const oldColumnName = (entity.fields[this.data.fieldName] as Model.AnyColumn).columnName
		const newColumnName = this.data.columnName
		return events.map(it => {
			if (
				it.tableName !== tableName ||
				(it.type !== EventType.create && it.type !== EventType.update) ||
				!it.values.hasOwnProperty(oldColumnName)
			) {
				return it
			}

			const { [oldColumnName]: value, ...values } = it.values
			return { ...it, values: { ...values, [newColumnName]: value } }
		})
	}

	describe() {
		return { message: `Change column name of field ${this.data.entityName}.${this.data.fieldName}` }
	}
}

namespace UpdateColumnNameModification {
	export const id = 'updateColumnName'

	export interface Data {
		entityName: string
		fieldName: string
		columnName: string
	}
}

export default UpdateColumnNameModification
