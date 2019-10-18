import { MigrationBuilder } from 'node-pg-migrate'
import { Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'

class RemoveEntityModification implements Modification<RemoveEntityModification.Data> {
	constructor(private readonly data: RemoveEntityModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		builder.dropTable(this.schema.model.entities[this.data.entityName].tableName)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(model => {
			const { [this.data.entityName]: removed, ...entities } = model.entities
			return {
				...model,
				entities: { ...entities },
			}
		})
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		const entity = this.schema.model.entities[this.data.entityName]
		return events.filter(it => {
			return it.tableName !== entity.tableName
		})
	}
}

namespace RemoveEntityModification {
	export const id = 'removeEntity'

	export interface Data {
		entityName: string
	}
}

export default RemoveEntityModification
