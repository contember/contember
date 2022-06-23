import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils.js'
import { ModificationHandlerStatic } from '../ModificationHandler.js'

export const UpdateEntityTableNameModification: ModificationHandlerStatic<UpdateEntityTableNameModificationData> = class {
	static id = 'updateEntityTableName'
	constructor(private readonly data: UpdateEntityTableNameModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			builder.renameView(entity.tableName, this.data.tableName)
			return
		}
		builder.renameTable(entity.tableName, this.data.tableName)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, ({ entity }) => ({
				...entity,
				tableName: this.data.tableName,
			})),
		)
	}

	describe() {
		return { message: `Change table name of entity ${this.data.entityName}` }
	}

	static createModification(data: UpdateEntityTableNameModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities)
			.filter(
				it =>
					originalSchema.model.entities[it.name] && originalSchema.model.entities[it.name].tableName !== it.tableName,
			)
			.map(it => UpdateEntityTableNameModification.createModification({ entityName: it.name, tableName: it.tableName }))
	}
}

export interface UpdateEntityTableNameModificationData {
	entityName: string
	tableName: string
}
