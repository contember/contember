import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'

class DisableOrphanRemovalModification implements Modification<DisableOrphanRemovalModification.Data> {
	constructor(private readonly data: DisableOrphanRemovalModification.Data, private readonly schema: Schema) {}

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
}

namespace DisableOrphanRemovalModification {
	export const id = 'disableOrphanRemoval'

	export interface Data {
		entityName: string
		fieldName: string
	}
}

export default DisableOrphanRemovalModification
