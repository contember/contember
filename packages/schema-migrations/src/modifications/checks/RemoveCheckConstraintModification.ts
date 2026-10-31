import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { isColumn } from '@contember/schema-utils'
import deepEqual from 'fast-deep-equal'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils.js'
import { createModificationType, Differ, ModificationHandler, ModificationHandlerCreateSqlOptions } from '../ModificationHandler.js'
import { wrapIdentifier } from '../../utils/dbHelpers.js'

export class RemoveCheckConstraintModificationHandler implements ModificationHandler<RemoveCheckConstraintModificationData> {
	constructor(private readonly data: RemoveCheckConstraintModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder, { invalidateDatabaseMetadata }: ModificationHandlerCreateSqlOptions): void {
		const entity = this.schema.model.entities[this.data.entityName]
		// IF EXISTS: PostgreSQL already dropped the check if a column it referenced was removed
		builder.sql(`ALTER TABLE ${wrapIdentifier(entity.tableName)} DROP CONSTRAINT IF EXISTS ${wrapIdentifier(this.data.checkName)}`)
		invalidateDatabaseMetadata()
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, ({ entity }) => {
				const { checks, ...rest } = entity
				const remaining = (checks ?? []).filter(it => it.name !== this.data.checkName)
				// an entity without checks carries no `checks` key, same as one built by the schema definition
				return remaining.length > 0 ? { ...rest, checks: remaining } : rest
			}),
		)
	}

	describe() {
		return { message: `Remove check constraint ${this.data.checkName} on entity ${this.data.entityName}` }
	}
}

export const removeCheckConstraintModification = createModificationType({
	id: 'removeCheckConstraint',
	handler: RemoveCheckConstraintModificationHandler,
})

export interface RemoveCheckConstraintModificationData {
	entityName: string
	checkName: string
}

// Physical columns of the entity's table, keyed by the field that owns them.
const getTableColumns = (entity: Model.Entity): Set<string> =>
	new Set(
		Object.values(entity.fields).flatMap(field => {
			if (isColumn(field)) {
				return [`column:${field.name}:${field.columnName}`]
			}
			return 'joiningColumn' in field ? [`relation:${field.name}:${field.joiningColumn.columnName}`] : []
		}),
	)

export class RemoveCheckConstraintDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(originalSchema.model.entities).flatMap(entity => {
			const updatedEntity = updatedSchema.model.entities[entity.name]
			// a removed entity drops its table, and the constraints with it
			if (!updatedEntity) {
				return []
			}
			// PostgreSQL drops a check together with a column it references and rewrites it on a column rename;
			// the expression is not parsed, so every check of an entity losing or renaming a column is recreated
			const updatedColumns = getTableColumns(updatedEntity)
			const columnsChanged = [...getTableColumns(entity)].some(it => !updatedColumns.has(it))
			const updatedChecks = updatedEntity.checks ?? []
			// a removed check is recreated by CreateCheckConstraintDiffer when it is still in the updated schema
			return (entity.checks ?? [])
				.filter(check => columnsChanged || !updatedChecks.some(it => deepEqual(it, check)))
				.map(check => removeCheckConstraintModification.createModification({ entityName: entity.name, checkName: check.name }))
		})
	}
}
