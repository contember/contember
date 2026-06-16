import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils.js'
import { createModificationType, Differ, ModificationHandler, ModificationHandlerCreateSqlOptions } from '../ModificationHandler.js'
import deepEqual from 'fast-deep-equal'
import { getIndexColumns } from './utils.js'
import { wrapIdentifier } from '../../utils/dbHelpers.js'

const indexIdentityEquals = (a: Pick<Model.Index, 'fields' | 'where' | 'include'>, b: Pick<Model.Index, 'fields' | 'where' | 'include'>) =>
	deepEqual(a.fields, b.fields) && (a.where ?? undefined) === (b.where ?? undefined) && deepEqual(a.include ?? undefined, b.include ?? undefined)

export class RemoveIndexModificationHandler implements ModificationHandler<RemoveIndexModificationData> {
	constructor(private readonly data: RemoveIndexModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder, { databaseMetadata, invalidateDatabaseMetadata }: ModificationHandlerCreateSqlOptions): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view && !entity.view.materialized) {
			return
		}
		const index = this.getIndex()

		// The DB-metadata layer (DatabaseMetadataResolver) does NOT expose the index predicate, so the
		// physical DROP is matched by table + columns. Postgres' pg_index.indkey includes the INCLUDE
		// columns alongside the key columns, so a covering index's metadata lists both — we match the
		// same combined set here. Two PARTIAL indexes on identical columns that differ only by WHERE are
		// therefore indistinguishable to the metadata; we detect that ambiguity below and fail loudly
		// rather than DROP the sibling the schema still expects to exist. Schema-level identity (see
		// getSchemaUpdater) IS predicate-aware, so the diff itself never conflates them.
		const columns = [
			...getIndexColumns({ entity, fields: index.fields, model: this.schema.model }),
			...(index.include ? getIndexColumns({ entity, fields: index.include, model: this.schema.model }) : []),
		]

		const indexNames = databaseMetadata.indexes.filter({ tableName: entity.tableName, columnNames: columns, unique: false }).getNames()

		// A partial index's predicate is invisible in the metadata, so several partial indexes on the
		// same columns all match here. Dropping every match would silently take out the indexes the
		// schema still expects — refuse instead, so the obsolete one can be dropped by hand.
		if (index.where !== undefined && indexNames.length > 1) {
			throw new Error(
				`Cannot unambiguously drop partial index on entity ${this.data.entityName} (${index.fields.join(', ')}): `
					+ `${indexNames.length} indexes match these columns and the predicate is not exposed in the database metadata. `
					+ `Drop the obsolete index manually.`,
			)
		}

		for (const name of indexNames) {
			builder.sql(`DROP INDEX ${wrapIdentifier(name)}`)
		}
		invalidateDatabaseMetadata()
	}

	public getSchemaUpdater(): SchemaUpdater {
		const index = this.getIndex()
		return updateModel(
			updateEntity(this.data.entityName, ({ entity }) => {
				const indexes = entity.indexes.filter(it => !indexIdentityEquals(it, index))
				return {
					...entity,
					indexes,
				}
			}),
		)
	}

	describe() {
		const index = this.getIndex()
		return { message: `Remove index (${index.fields.join(', ')}) on entity ${this.data.entityName}` }
	}

	private getIndex(): Pick<Model.Index, 'fields' | 'where' | 'include'> {
		const entity = this.schema.model.entities[this.data.entityName]
		if ('indexName' in this.data && this.data.indexName !== undefined) {
			const index = entity.indexes.find(it => it.name === this.data.indexName)
			if (!index) {
				throw new Error()
			}
			return { fields: index.fields, where: index.where, include: index.include }
		}
		if (!this.data.fields) {
			throw new Error()
		}
		return { fields: this.data.fields, where: this.data.where, include: this.data.include }
	}
}

export const removeIndexModification = createModificationType({
	id: 'removeIndex',
	handler: RemoveIndexModificationHandler,
})

export type RemoveIndexModificationData =
	| {
		entityName: string
		indexName: string
		fields?: never
		where?: never
		include?: never
	}
	| {
		entityName: string
		fields: readonly string[]
		where?: string
		include?: readonly string[]
		indexName?: never
	}

export class RemoveIndexDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(originalSchema.model.entities).flatMap(entity =>
			entity.indexes
				.filter(
					it => {
						const updatedEntity = updatedSchema.model.entities[entity.name]
						if (!updatedEntity) {
							return false
						}
						return !updatedEntity.indexes.find(index => deepEqual(index, it))
					},
				)
				.map(index =>
					removeIndexModification.createModification({
						entityName: entity.name,
						fields: index.fields,
						// keep WHERE/INCLUDE in the modification so two partial indexes on the same
						// columns are removed individually; omit the keys when absent to keep legacy
						// (non-partial) migration JSON byte-for-byte identical.
						...(index.where !== undefined ? { where: index.where } : {}),
						...(index.include !== undefined ? { include: index.include } : {}),
					})
				)
		)
	}
}
