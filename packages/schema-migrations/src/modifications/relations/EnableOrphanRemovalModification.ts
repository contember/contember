import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'

class EnableOrphanRemovalModification implements Modification<EnableOrphanRemovalModification.Data> {
	constructor(private readonly data: EnableOrphanRemovalModification.Data, private readonly schema: Schema) {}

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
}

namespace EnableOrphanRemovalModification {
	export const id = 'enableOrphanRemoval'

	export interface Data {
		entityName: string
		fieldName: string
	}
}

export default EnableOrphanRemovalModification
