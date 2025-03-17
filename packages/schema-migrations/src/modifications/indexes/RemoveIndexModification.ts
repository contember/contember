import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import {
	createModificationType,
	Differ,
	ModificationHandler,
	ModificationHandlerCreateSqlOptions,
} from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'
import { getIndexColumns } from './utils'
import { wrapIdentifier } from '../../utils/dbHelpers'

export class RemoveIndexModificationHandler implements ModificationHandler<RemoveIndexModificationData>  {
	constructor(private readonly data: RemoveIndexModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder, { databaseMetadata, invalidateDatabaseMetadata }: ModificationHandlerCreateSqlOptions): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view && !entity.view.materialized) {
			return
		}
		const fields = this.getFields()

		const columns = getIndexColumns({
			entity,
			fields,
			model: this.schema.model,
		})

		const indexNames = databaseMetadata.indexes.filter({ tableName: entity.tableName, columnNames: columns, unique: false }).getNames()

		for (const name of indexNames) {
			builder.sql(`DROP INDEX ${wrapIdentifier(name)}`)
		}
		invalidateDatabaseMetadata()
	}

	public getSchemaUpdater(): SchemaUpdater {
		const fields = this.getFields()
		return updateModel(
			updateEntity(this.data.entityName, ({ entity }) => {
				const indexes = entity.indexes.filter(it => !deepEqual(it.fields, fields))
				return {
					...entity,
					indexes,
				}
			}),
		)
	}

	describe() {
		const fields = this.getFields()
		return { message: `Remove index (${fields.join(', ')}) on entity ${this.data.entityName}` }
	}

	getFields() {
		const entity = this.schema.model.entities[this.data.entityName]
		const fields = 'indexName' in this.data
			? entity.indexes.find(it => it.name === this.data.indexName)?.fields
			: this.data.fields
		if (!fields) {
			throw new Error()
		}
		return fields
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
	}
	| {
		entityName: string
		fields: readonly string[]
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
					}),
				),
		)
	}
}
