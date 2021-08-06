import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateModel } from '../schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'

export const UpdateEntityTableNameModification: ModificationHandlerStatic<UpdateEntityTableNameModificationData> = class {
	static id = 'updateEntityTableName'
	constructor(private readonly data: UpdateEntityTableNameModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		builder.renameTable(entity.tableName, this.data.tableName)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, entity => ({
				...entity,
				tableName: this.data.tableName,
			})),
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		const entity = this.schema.model.entities[this.data.entityName]
		return events.map(it => {
			if (it.tableName !== entity.tableName) {
				return it
			}
			return { ...it, tableName: this.data.tableName }
		})
	}

	describe() {
		return { message: `Change table name of entity ${this.data.entityName}` }
	}

	static createModification(data: UpdateEntityTableNameModificationData) {
		return { modification: this.id, ...data }
	}
}

export interface UpdateEntityTableNameModificationData {
	entityName: string
	tableName: string
}
