import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils.js'
import { createModificationType, Differ, ModificationHandler, ModificationHandlerCreateSqlOptions } from '../ModificationHandler.js'
import deepEqual from 'fast-deep-equal'
import { getIndexColumns } from './utils.js'
import { wrapIdentifier } from '../../utils/dbHelpers.js'

type IndexIdentity = Pick<Model.Index, 'fields' | 'where' | 'include' | 'columnOptions'>
const indexIdentityEquals = (a: IndexIdentity, b: IndexIdentity) =>
	deepEqual(a.fields, b.fields)
	&& (a.where ?? undefined) === (b.where ?? undefined)
	&& deepEqual(a.include ?? undefined, b.include ?? undefined)
	&& deepEqual(a.columnOptions ?? undefined, b.columnOptions ?? undefined)

export class RemoveIndexModificationHandler implements ModificationHandler<RemoveIndexModificationData> {
	constructor(private readonly data: RemoveIndexModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder, { databaseMetadata, invalidateDatabaseMetadata }: ModificationHandlerCreateSqlOptions): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view && !entity.view.materialized) {
			return
		}
		const index = this.getIndex()

		// The DB-metadata layer (DatabaseMetadataResolver) exposes only table + columns (as an unordered
		// set) + uniqueness, so the physical DROP is matched by table + columns. Postgres' pg_index.indkey
		// includes the INCLUDE columns alongside the key columns, so a covering index's metadata lists both —
		// we match the same combined set here. Everything that distinguishes two indexes on the same column
		// set — the partial WHERE predicate, per-column options (sort order / NULLS / operator class), and
		// even key-column ORDER (the set comparison is order-insensitive) — is invisible to the metadata,
		// so such siblings are indistinguishable here. We detect that ambiguity below and fail loudly rather
		// than DROP a sibling the schema still expects to keep. Schema-level identity (see getSchemaUpdater)
		// IS fully aware of these discriminators, so the diff itself never conflates them.
		const columns = [
			...getIndexColumns({ entity, fields: index.fields, model: this.schema.model }),
			...(index.include ? getIndexColumns({ entity, fields: index.include, model: this.schema.model }) : []),
		]

		const indexNames = databaseMetadata.indexes.filter({ tableName: entity.tableName, columnNames: columns, unique: false }).getNames()

		// If more than one physical index matches these columns we cannot tell which one this modification
		// targets (the metadata hides the predicate / per-column options / column order that distinguish
		// them). Dropping every match would silently take out an index the schema still expects — refuse
		// instead, so the obsolete one can be dropped by hand.
		if (indexNames.length > 1) {
			throw new Error(
				`Cannot unambiguously drop index on entity ${this.data.entityName} (${index.fields.join(', ')}): `
					+ `${indexNames.length} indexes match these columns and the database metadata does not expose the predicate (where), `
					+ `per-column options (sort order / NULLS / operator class) or column order that distinguish them. `
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

	private getIndex(): IndexIdentity {
		const { entityName } = this.data
		const entity = this.schema.model.entities[entityName]
		if ('indexName' in this.data && this.data.indexName !== undefined) {
			const index = entity.indexes.find(it => it.name === this.data.indexName)
			if (!index) {
				throw new Error(`Index named "${this.data.indexName}" not found on entity ${entityName}`)
			}
			return { fields: index.fields, where: index.where, include: index.include, columnOptions: index.columnOptions }
		}
		if (!this.data.fields) {
			throw new Error(`removeIndex modification on entity ${entityName} requires either "indexName" or "fields"`)
		}
		return { fields: this.data.fields, where: this.data.where, include: this.data.include, columnOptions: this.data.columnOptions }
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
		columnOptions?: never
	}
	| {
		entityName: string
		fields: readonly string[]
		where?: string
		include?: readonly string[]
		columnOptions?: { readonly [field: string]: Model.IndexColumnOptions }
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
						// keep WHERE/INCLUDE/columnOptions in the modification so indexes that share the same
						// key columns but differ by predicate or per-column options are removed individually;
						// omit the keys when absent to keep legacy migration JSON byte-for-byte identical.
						...(index.where !== undefined ? { where: index.where } : {}),
						...(index.include !== undefined ? { include: index.include } : {}),
						...(index.columnOptions !== undefined ? { columnOptions: index.columnOptions } : {}),
					})
				)
		)
	}
}
