import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'

export class RemoveIndexModificationHandler implements ModificationHandler<RemoveIndexModificationData>  {
	constructor(private readonly data: RemoveIndexModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		builder.dropIndex(entity.tableName, [], {
			name: this.data.indexName,
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, ({ entity }) => {
				const { [this.data.indexName]: removed, ...indexes } = entity.indexes
				return {
					...entity,
					indexes,
				}
			}),
		)
	}

	describe() {
		const fields = this.schema.model.entities[this.data.entityName].indexes[this.data.indexName].fields
		return { message: `Remove index (${fields.join(', ')}) on entity ${this.data.entityName}` }
	}
}

export const removeIndexModification = createModificationType({
	id: 'removeIndex',
	handler: RemoveIndexModificationHandler,
})


export class RemoveIndexDiffer implements Differ {

	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(originalSchema.model.entities).flatMap(entity =>
			Object.values(entity.indexes)
				.filter(
					it =>
						updatedSchema.model.entities[entity.name] &&
						(!updatedSchema.model.entities[entity.name].indexes[it.name] ||
							!deepEqual(it.fields, updatedSchema.model.entities[entity.name].indexes[it.name].fields)),
				)
				.map(index =>
					removeIndexModification.createModification({
						entityName: entity.name,
						indexName: index.name,
					}),
				),
		)
	}
}

export interface RemoveIndexModificationData {
	entityName: string
	indexName: string
}
