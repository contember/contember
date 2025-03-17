import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import {
	createModificationType,
	Differ,
	ModificationHandler,
	ModificationHandlerCreateSqlOptions,
} from '../ModificationHandler'
import { wrapIdentifier } from '../../utils/dbHelpers'
import { getIndexColumns } from './utils'
import deepEqual from 'fast-deep-equal'

export class CreateIndexModificationHandler implements ModificationHandler<CreateIndexModificationData> {
	constructor(private readonly data: CreateIndexModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder, { databaseMetadata, invalidateDatabaseMetadata }: ModificationHandlerCreateSqlOptions): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view && !entity.view.materialized) {
			return
		}
		const fields = this.data.index.fields
		const columns = getIndexColumns({
			fields,
			entity,
			model: this.schema.model,
		})

		const tableNameId = wrapIdentifier(entity.tableName)
		const columnNameIds = columns.map(wrapIdentifier)

		builder.sql(`CREATE INDEX ON ${tableNameId} (${columnNameIds.join(', ')})`)

		invalidateDatabaseMetadata()
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, ({ entity }) => ({
				...entity,
				indexes: [
					...entity.indexes,
					this.data.index,
				],
			})),
		)
	}

	describe() {
		return {
			message: `Create index(${this.data.index.fields.join(', ')}) on entity ${this.data.entityName}`,
		}
	}
}

export const createIndexModification = createModificationType({
	id: 'createIndex',
	handler: CreateIndexModificationHandler,
})

export interface CreateIndexModificationData {
	entityName: string
	index: Model.Index
}

export class CreateIndexDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities).flatMap(entity =>
			entity.indexes
				.filter(it => !originalSchema.model.entities[entity.name].indexes.find(idx => deepEqual(idx, it)))
				.map(index => createIndexModification.createModification({
					entityName: entity.name,
					index,
				})),
		)
	}
}
