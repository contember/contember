import { MigrationBuilder } from 'node-pg-migrate'
import { Schema } from '@contember/schema'
import { ContentEvent } from '../../../dtos/Event'
import { SchemaUpdater, updateEntity, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'

class RemoveUniqueConstraintModification implements Modification<RemoveUniqueConstraintModification.Data> {
	constructor(private readonly data: RemoveUniqueConstraintModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		builder.dropConstraint(entity.tableName, this.data.constraintName)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, entity => {
				const { [this.data.constraintName]: removed, ...unique } = entity.unique
				return {
					...entity,
					unique,
				}
			}),
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}
}

namespace RemoveUniqueConstraintModification {
	export const id = 'removeUniqueConstraint'

	export interface Data {
		entityName: string
		constraintName: string
	}
}

export default RemoveUniqueConstraintModification
