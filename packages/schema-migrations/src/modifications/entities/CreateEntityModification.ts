import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateModel } from '../schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { createEventTrigger, createEventTrxTrigger } from '../sqlUpdateUtils'

export const CreateEntityModification: ModificationHandlerStatic<CreateEntityModificationData> = class {
	static id = 'createEntity'
	constructor(private readonly data: CreateEntityModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.data.entity
		const primaryColumn = entity.fields[entity.primary] as Model.AnyColumn
		builder.createTable(entity.tableName, {
			[primaryColumn.name]: {
				primaryKey: true,
				type: primaryColumn.type === Model.ColumnType.Enum ? `"${primaryColumn.columnType}"` : primaryColumn.columnType,
				notNull: true,
			},
		})
		createEventTrigger(builder, entity.tableName, [entity.primaryColumn])
		createEventTrxTrigger(builder, entity.tableName)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(model => ({
			...model,
			entities: {
				...model.entities,
				[this.data.entity.name]: this.data.entity,
			},
		}))
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return { message: `Add entity ${this.data.entity.name}` }
	}

	static createModification(data: CreateEntityModificationData) {
		return { modification: this.id, ...data }
	}
}

export interface CreateEntityModificationData {
	entity: Model.Entity
}
