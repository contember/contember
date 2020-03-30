import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'

class UpdateRelationOnDeleteModification implements Modification<UpdateRelationOnDeleteModification.Data> {
	constructor(private readonly data: UpdateRelationOnDeleteModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName, onDelete } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.AnyRelation & Model.JoiningColumnRelation>(fieldName, field => ({
					...field,
					joiningColumn: { ...field.joiningColumn, onDelete },
				})),
			),
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return { message: `Change on-delete policy of relation ${this.data.entityName}.${this.data.fieldName}` }
	}
}

namespace UpdateRelationOnDeleteModification {
	export const id = 'updateRelationOnDelete'

	export interface Data {
		entityName: string
		fieldName: string
		onDelete: Model.OnDelete
	}
}

export default UpdateRelationOnDeleteModification
