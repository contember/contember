import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils.js'
import { createModificationType, Differ, ModificationHandler, ModificationHandlerCreateSqlOptions } from '../ModificationHandler.js'
import { wrapIdentifier } from '../../utils/dbHelpers.js'
import { getIndexColumns } from './utils.js'
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
		// Each key column may carry its own operator class (falling back to the global opClass),
		// sort direction (ASC is the default and omitted) and NULLS placement. Postgres expects
		// the parts in this order: column [opclass] [ASC|DESC] [NULLS {FIRST|LAST}].
		// The opclass is emitted verbatim (validated to an identifier shape in ModelValidator). Migrations
		// run with search_path set to the stage schema, so the value must already carry any needed schema
		// qualifier: an extension's class as "public.gin_trgm_ops", a built-in one (in pg_catalog) as
		// plain "text_pattern_ops".
		const columnNameIds = index.fields.map((field, i) => {
			const options = index.columnOptions?.[field]
			const opClass = options?.opClass ?? index.opClass
			const opClassSuffix = opClass ? ` ${opClass}` : ''
			const orderSuffix = options?.order === 'desc' ? ' DESC' : ''
			const nullsSuffix = options?.nulls === 'first' ? ' NULLS FIRST' : options?.nulls === 'last' ? ' NULLS LAST' : ''
			return wrapIdentifier(columns[i]) + opClassSuffix + orderSuffix + nullsSuffix
		})
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
		// columnOptions is part of index identity, so surface it in the description too — otherwise two
		// indexes on the same columns differing only by sort order / NULLS / opClass render identically.
		const columnOptionsText = index.columnOptions && Object.keys(index.columnOptions).length > 0
			? ` options (${
				Object.entries(index.columnOptions).map(([field, opts]) => {
					const parts = [opts.order, opts.nulls ? `nulls ${opts.nulls}` : '', opts.opClass ? `opclass ${opts.opClass}` : ''].filter(Boolean)
					return `${field}: ${parts.join(' ')}`
				}).join(', ')
			})`
			: ''
		return {
			message: `Create index(${index.fields.join(', ')})${methodText}${includeText}${whereText}${columnOptionsText} on entity ${this.data.entityName}`,
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
