import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'

export class UpdateEntityTableNameModificationHandler implements ModificationHandler<UpdateEntityTableNameModificationData> {
	constructor(protected readonly data: UpdateEntityTableNameModificationData, protected readonly schema: Schema) {}

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
}

export interface UpdateEntityTableNameModificationData {
	entityName: string
	tableName: string
}

export const updateEntityTableNameModification = createModificationType({
	id: 'updateEntityTableName',
	handler: UpdateEntityTableNameModificationHandler,
})

export class UpdateEntityTableNameDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities)
			.filter(
				it =>
					originalSchema.model.entities[it.name] && originalSchema.model.entities[it.name].tableName !== it.tableName,
			)
			.map(it => updateEntityTableNameModification.createModification({
				entityName: it.name,
				tableName: it.tableName,
			}))
	}
}
