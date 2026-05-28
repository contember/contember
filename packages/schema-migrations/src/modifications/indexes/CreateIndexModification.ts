import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler, ModificationHandlerCreateSqlOptions } from '../ModificationHandler'
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
		const index = this.data.index
		const columns = getIndexColumns({
			fields: index.fields,
			entity,
			model: this.schema.model,
		})

		const tableNameId = wrapIdentifier(entity.tableName)
		const opClassSuffix = index.opClass ? ` public.${index.opClass}` : ''
		const columnNameIds = columns.map(c => wrapIdentifier(c) + opClassSuffix)
		const methodClause = index.method ? ` USING ${index.method}` : ''

		const includeClause = index.include?.length
			? ` INCLUDE (${getIndexColumns({ fields: index.include, entity, model: this.schema.model }).map(wrapIdentifier).join(', ')})`
			: ''
		// `where` is a raw, developer-authored SQL predicate. Its trust boundary is identical to
		// @c.View's raw body — committed to a migration and gated by code review, not end-user input.
		// Its shape is validated in ModelValidator (non-empty, no statement terminator); here we only
		// wrap it in parentheses so it stays a self-contained boolean expression.
		const whereClause = index.where ? ` WHERE (${index.where})` : ''

		builder.sql(`CREATE INDEX ON ${tableNameId}${methodClause} (${columnNameIds.join(', ')})${includeClause}${whereClause}`)

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
		const index = this.data.index
		const methodText = index.method ? ` using ${index.method}` : ''
		const includeText = index.include?.length ? ` include (${index.include.join(', ')})` : ''
		const whereText = index.where ? ` where ${index.where}` : ''
		return {
			message: `Create index(${index.fields.join(', ')})${methodText}${includeText}${whereText} on entity ${this.data.entityName}`,
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
				.map(index =>
					createIndexModification.createModification({
						entityName: entity.name,
						index,
					})
				)
		)
	}
}
