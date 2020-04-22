import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'

class UpdateRelationOrderByModification implements Modification<UpdateRelationOrderByModification.Data> {
	constructor(private readonly data: UpdateRelationOrderByModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName, orderBy } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.AnyRelation & Model.OrderableRelation>(fieldName, field => ({
					...field,
					orderBy,
				})),
			),
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return { message: `Update order-by of relation ${this.data.entityName}.${this.data.fieldName}` }
	}
}

namespace UpdateRelationOrderByModification {
	export const id = 'updateRelationOrderBy'

	export interface Data {
		entityName: string
		fieldName: string
		orderBy: Model.OrderBy[]
	}
}

export default UpdateRelationOrderByModification
