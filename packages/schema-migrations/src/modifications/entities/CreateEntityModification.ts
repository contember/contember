import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateModel } from '../utils/schemaUpdateUtils'
import { ModificationHandlerOptions, ModificationHandlerStatic } from '../ModificationHandler'
import { createEventTrigger, createEventTrxTrigger } from '../utils/sqlUpdateUtils'

export const CreateEntityModification: ModificationHandlerStatic<CreateEntityModificationData> = class {
	static id = 'createEntity'
	constructor(
		private readonly data: CreateEntityModificationData,
		private readonly schema: Schema,
		private readonly options: ModificationHandlerOptions,
	) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.data.entity
		if (entity.view) {
			// BC
			builder.createView(entity.tableName, {}, entity.view.sql)
			return
		}
		const primaryColumn = entity.fields[entity.primary] as Model.AnyColumn
		builder.createTable(entity.tableName, {
			[primaryColumn.name]: {
				primaryKey: true,
				type: primaryColumn.type === Model.ColumnType.Enum ? `"${primaryColumn.columnType}"` : primaryColumn.columnType,
				notNull: true,
			},
		})
		createEventTrigger(builder, this.options.systemSchema, entity.tableName, [entity.primaryColumn])
		createEventTrxTrigger(builder, this.options.systemSchema, entity.tableName)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(({ model }) => ({
			...model,
			entities: {
				...model.entities,
				[this.data.entity.name]: this.data.entity,
			},
		}))
	}


	describe() {
		return { message: `Add entity ${this.data.entity.name}` }
	}

	static createModification(data: CreateEntityModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities)
			.filter(it => !originalSchema.model.entities[it.name])
			.filter(it => !it.view)
			.map(entity =>
				CreateEntityModification.createModification({
					entity: {
						...entity,
						fields: {
							[entity.primary]: entity.fields[entity.primary],
						},
						unique: {},
					},
				}),
			)
	}
}

export interface CreateEntityModificationData {
	entity: Model.Entity
}
