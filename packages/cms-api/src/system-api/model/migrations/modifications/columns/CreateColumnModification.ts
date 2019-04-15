import { MigrationBuilder } from 'node-pg-migrate'
import { Model, Schema } from 'cms-common'
import { ContentEvent } from '../../../dtos/Event'
import { addField, SchemaUpdater, updateEntity, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { EventType } from '../../../EventType'
import { NoDataError, resolveDefaultValue } from '../../../../../content-schema/dataUtils'

class CreateColumnModification implements Modification<CreateColumnModification.Data> {
	constructor(private readonly data: CreateColumnModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		const column = this.data.field
		builder.addColumn(entity.tableName, {
			[column.columnName]: {
				type: column.type === Model.ColumnType.Enum ? `"${column.columnType}"` : column.columnType,
				notNull: !column.nullable,
			},
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(updateEntity(this.data.entityName, addField(this.data.field)))
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		const entity = this.schema.model.entities[this.data.entityName]

		return events.map(it => {
			if (it.tableName !== entity.tableName || it.type !== EventType.create) {
				return it
			}

			try {
				const value = resolveDefaultValue(this.data.field, it.createdAt)
				return {
					...it,
					[this.data.field.columnName]: value,
				}
			} catch (e) {
				// if (e instanceof NoDataError) {
				// 	return {...it, errors: [...it.errors || []]}
				// }
				throw e
			}
		})
	}
}

namespace CreateColumnModification {
	export const id = 'createColumn'

	export interface Data {
		entityName: string
		field: Model.AnyColumn
	}
}

export default CreateColumnModification
