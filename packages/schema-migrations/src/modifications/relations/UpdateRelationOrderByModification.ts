import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'

export const UpdateRelationOrderByModification: ModificationHandlerStatic<UpdateRelationOrderByModificationData> = class {
	static id = 'updateRelationOrderBy'
	constructor(private readonly data: UpdateRelationOrderByModificationData, private readonly schema: Schema) {}

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

	static createModification(data: UpdateRelationOrderByModificationData) {
		return { modification: this.id, ...data }
	}
}

export interface UpdateRelationOrderByModificationData {
	entityName: string
	fieldName: string
	orderBy: Model.OrderBy[]
}
