import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateModel } from '../schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'

export const RemoveUniqueConstraintModification: ModificationHandlerStatic<RemoveUniqueConstraintModificationData> = class {
	static id = 'removeUniqueConstraint'
	constructor(private readonly data: RemoveUniqueConstraintModificationData, private readonly schema: Schema) {}

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

	describe() {
		const fields = this.schema.model.entities[this.data.entityName].unique[this.data.constraintName].fields
		return { message: `Remove unique constraint (${fields.join(', ')}) on entity ${this.data.entityName}` }
	}

	static createModification(data: RemoveUniqueConstraintModificationData) {
		return { modification: this.id, ...data }
	}
}

export interface RemoveUniqueConstraintModificationData {
	entityName: string
	constraintName: string
}
