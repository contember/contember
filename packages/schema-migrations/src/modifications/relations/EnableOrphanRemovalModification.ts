import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'

export const EnableOrphanRemovalModification: ModificationHandlerStatic<EnableOrphanRemovalModificationData> = class {
	static id = 'enableOrphanRemoval'
	constructor(private readonly data: EnableOrphanRemovalModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.OneHasOneOwningRelation>(fieldName, field => ({
					...field,
					orphanRemoval: true,
				})),
			),
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return {
			message: `Enable orphan removal on ${this.data.entityName}.${this.data.fieldName}`,
		}
	}

	static createModification(data: EnableOrphanRemovalModificationData) {
		return { modification: this.id, ...data }
	}
}

export interface EnableOrphanRemovalModificationData {
	entityName: string
	fieldName: string
}
