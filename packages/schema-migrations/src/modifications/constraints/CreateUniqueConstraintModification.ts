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
import { getUniqueConstraintColumns } from './utils'
import deepEqual from 'fast-deep-equal'

export class CreateUniqueConstraintModificationHandler implements ModificationHandler<CreateUniqueConstraintModificationData> {
	constructor(private readonly data: CreateUniqueConstraintModificationData, private readonly schema: Schema) {
	}

	public createSql(builder: MigrationBuilder, { invalidateDatabaseMetadata }: ModificationHandlerCreateSqlOptions): void {
		const entity = this.schema.model.entities[this.data.entityName]
		const shouldExecuteSql =
			!entity.view
			|| (this.data.unique.index && entity.view.materialized)
		if (!shouldExecuteSql) {
			return
		}
		const fields = this.data.unique.fields
		const columns = getUniqueConstraintColumns({
			entity,
			model: this.schema.model,
			fields,
		})

		const tableNameId = wrapIdentifier(entity.tableName)
		const columnNameIds = columns.map(wrapIdentifier)

		if ('index' in this.data.unique && this.data.unique.index) {
			const nulls = this.data.unique.nulls === 'not distinct' ? ' NULLS NOT DISTINCT' : ''
			builder.sql(`CREATE UNIQUE INDEX ON ${tableNameId} (${columnNameIds.join(', ')})${nulls}`)
		} else {
			let checkModifier = ''
			if (this.data.unique.timing === 'deferred') {
				checkModifier = ' INITIALLY DEFERRED'
			} else if (this.data.unique.timing === 'deferrable') {
				checkModifier = ' DEFERRABLE'
			}

			builder.sql(`ALTER TABLE ${tableNameId} ADD UNIQUE (${columnNameIds.join(', ')})${checkModifier}`)
		}


		invalidateDatabaseMetadata()
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, ({ entity }) => ({
				...entity,
				unique: [
					...entity.unique,
					this.data.unique,
				],
			})),
		)
	}

	describe({ createdEntities }: { createdEntities: string[] }) {
		return {
			message: `Create unique ${this.data.unique.index ? 'index' : 'constraint'} (${this.data.unique.fields.join(', ')}) on entity ${this.data.entityName}`,
			failureWarning: !createdEntities.includes(this.data.entityName)
				? 'Make sure no conflicting rows exists, otherwise this may fail in runtime.'
				: undefined,
		}
	}

}

export const createUniqueConstraintModification = createModificationType({
	id: 'createUniqueConstraint',
	handler: CreateUniqueConstraintModificationHandler,
})

export interface CreateUniqueConstraintModificationData {
	entityName: string
	unique: Model.UniqueConstraint | Model.UniqueIndex
}

export class CreateUniqueConstraintDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities).flatMap(entity =>
			entity.unique
				.filter(it => !originalSchema.model.entities[entity.name].unique.find(uniq => deepEqual(uniq.fields, it.fields)))
				.map(unique => createUniqueConstraintModification.createModification({
					entityName: entity.name,
					unique,
				})),
		)
	}
}
