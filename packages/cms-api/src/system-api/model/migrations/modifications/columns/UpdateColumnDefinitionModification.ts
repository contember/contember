import { MigrationBuilder } from 'node-pg-migrate'
import { Model, Schema } from 'cms-common'
import { ContentEvent } from '../../../dtos/Event'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'

class UpdateColumnDefinitionModification implements Modification<UpdateColumnDefinitionModification.Data> {
	constructor(private readonly data: UpdateColumnDefinitionModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		const field = entity.fields[this.data.fieldName] as Model.AnyColumn
		builder.alterColumn(entity.tableName, field.columnName, {
			type: this.data.definition.columnType,
			default: this.data.definition.default,
			allowNull: this.data.definition.nullable,
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(
				this.data.entityName,
				updateField<Model.AnyColumn>(this.data.fieldName, field => {
					return {
						...this.data.definition,
						name: field.name,
						columnName: field.columnName,
					}
				})
			)
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events // todo transform type
	}
}

namespace UpdateColumnDefinitionModification {
	export const id = 'updateColumnDefinition'

	export interface Data {
		entityName: string
		fieldName: string
		definition: Model.AnyColumnDefinition
	}
}

export default UpdateColumnDefinitionModification
