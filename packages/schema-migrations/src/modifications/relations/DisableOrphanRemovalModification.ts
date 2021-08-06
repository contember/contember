import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'

export const DisableOrphanRemovalModification: ModificationHandlerStatic<DisableOrphanRemovalModificationData> = class {
	static id = 'disableOrphanRemoval'

	constructor(private readonly data: DisableOrphanRemovalModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.OneHasOneOwningRelation>(fieldName, ({ orphanRemoval, ...field }) => field),
			),
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return {
			message: `Disable orphan removal on ${this.data.entityName}.${this.data.fieldName}`,
		}
	}

	static createModification(data: DisableOrphanRemovalModificationData) {
		return { modification: this.id, ...data }
	}
}
export interface DisableOrphanRemovalModificationData {
	entityName: string
	fieldName: string
}
