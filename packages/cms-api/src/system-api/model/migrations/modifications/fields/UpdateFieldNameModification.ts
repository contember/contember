import { MigrationBuilder } from 'node-pg-migrate'
import { Schema } from '@contember/schema'
import { ContentEvent } from '../../../dtos/Event'
import { SchemaUpdater, updateEntity, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'

class UpdateFieldNameModification implements Modification<UpdateFieldNameModification.Data> {
	constructor(private readonly data: UpdateFieldNameModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, entity => {
				const { [this.data.fieldName]: updated, ...fields } = entity.fields
				return {
					...entity,
					fields: {
						...fields,
						[this.data.newFieldName]: { ...updated, name: this.data.newFieldName },
					},
				}
			}),
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}
}

namespace UpdateFieldNameModification {
	export const id = 'updateFieldName'

	export interface Data {
		entityName: string
		fieldName: string
		newFieldName: string
	}
}

export default UpdateFieldNameModification
