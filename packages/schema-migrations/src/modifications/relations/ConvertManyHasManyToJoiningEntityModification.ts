import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { addField, removeField, SchemaUpdater, updateEntity, updateModel, updateSchema } from '../utils/schemaUpdateUtils.js'
import {
	createModificationType,
	ModificationHandler,
	ModificationHandlerCreateSqlOptions,
	ModificationHandlerOptions,
} from '../ModificationHandler.js'
import { createEventTrigger, createEventTrxTrigger, dropEventTrigger } from '../utils/sqlUpdateUtils.js'
import { getColumnSqlType } from '../utils/columnUtils.js'
import { wrapIdentifier } from '../../utils/dbHelpers.js'
import { VERSION_LATEST } from '../ModificationVersions.js'
import { PossibleEntityShapeInMigrations } from '../../utils/PartialEntity.js'

/**
 * Promotes an implicit many-has-many relation (backed by a junction table with a composite primary key)
 * into an explicit joining entity, while preserving all existing rows in the junction table.
 *
 * The junction table is reused in place — no data is copied:
 *  - a surrogate `id` (uuid) primary key column is added and back-filled (see {@link UUID_GENERATOR}),
 *  - the original composite primary key is dropped and the new `id` becomes the primary key,
 *  - both foreign-key columns are kept and become two many-has-one relations of the new entity,
 *  - the event-log trigger is re-pointed from the two foreign-key columns onto the new `id` column.
 *
 * The original many-has-many owning relation (and its inverse side, if any) is removed from the schema.
 *
 * Limitations / requirements:
 *  - The junction table is assumed to use the standard composite primary key produced by Contember.
 *  - UUID back-filling relies on the `public.uuid_generate_v4()` SQL function that Contember installs
 *    during tenant setup. No PostgreSQL extension is created by this migration.
 */
export class ConvertManyHasManyToJoiningEntityModificationHandler implements ModificationHandler<ConvertManyHasManyToJoiningEntityModificationData> {
	constructor(
		private readonly data: ConvertManyHasManyToJoiningEntityModificationData,
		private readonly schema: Schema,
		private readonly options: ModificationHandlerOptions,
	) {}

	public createSql(builder: MigrationBuilder, { systemSchema }: ModificationHandlerCreateSqlOptions): void {
		const { relation } = this.getRelation()
		const joiningTable = relation.joiningTable
		const tableName = joiningTable.tableName
		const tableNameId = wrapIdentifier(tableName)

		const joiningEntity = this.data.joiningEntity
		const primaryColumn = joiningEntity.fields[joiningEntity.primary] as Model.AnyColumn
		const primaryColumnName = primaryColumn.columnName
		const primaryColumnNameId = wrapIdentifier(primaryColumnName)
		const primaryColumnType = getColumnSqlType(primaryColumn)

		// Re-point the event-log trigger (logs on the composite key) before changing the primary key.
		if (joiningTable.eventLog.enabled) {
			dropEventTrigger(builder, tableName)
		}

		// Add the surrogate primary key and back-fill it for existing rows.
		builder.sql(`ALTER TABLE ${tableNameId} ADD COLUMN ${primaryColumnNameId} ${primaryColumnType}`)
		builder.sql(`UPDATE ${tableNameId} SET ${primaryColumnNameId} = ${UUID_GENERATOR}`)
		builder.sql(`ALTER TABLE ${tableNameId} ALTER COLUMN ${primaryColumnNameId} SET NOT NULL`)

		// Replace the composite primary key with the surrogate one.
		builder.sql(`ALTER TABLE ${tableNameId} DROP CONSTRAINT ${wrapIdentifier(`${tableName}_pkey`)}`)
		builder.sql(`ALTER TABLE ${tableNameId} ADD PRIMARY KEY (${primaryColumnNameId})`)

		// The original join uniqueness is no longer enforced by the (now surrogate) primary key.
		builder.sql(
			`ALTER TABLE ${tableNameId} ADD UNIQUE (${wrapIdentifier(joiningTable.joiningColumn.columnName)}, ${
				wrapIdentifier(joiningTable.inverseJoiningColumn.columnName)
			})`,
		)

		if (joiningEntity.eventLog?.enabled !== false) {
			createEventTrigger(builder, systemSchema, tableName, [primaryColumnName])
			createEventTrxTrigger(builder, systemSchema, tableName)
		}
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entity, relation } = this.getRelation()
		const version = this.options.formatVersion ?? VERSION_LATEST
		const joiningEntity = this.data.joiningEntity

		return updateSchema(
			// remove the original many-has-many (owning side + inverse side)
			removeField(entity.name, relation.name, version),
			// register the new joining entity reusing the junction table
			updateModel(({ model }) => ({
				...model,
				entities: {
					...model.entities,
					[joiningEntity.name]: {
						eventLog: { enabled: true },
						...joiningEntity,
						unique: Object.values(joiningEntity.unique ?? []),
						indexes: Object.values(joiningEntity.indexes ?? []),
					},
				},
			})),
			// add inverse one-has-many relations on both connected entities
			this.data.sourceInverseSide
				? updateModel(updateEntity(entity.name, addField(this.data.sourceInverseSide)))
				: undefined,
			this.data.targetInverseSide
				? updateModel(updateEntity(relation.target, addField(this.data.targetInverseSide)))
				: undefined,
		)
	}

	describe() {
		return {
			message: `Converts ManyHasMany relation ${this.data.entityName}.${this.data.fieldName} to a joining entity ${this.data.joiningEntity.name}`,
		}
	}

	private getRelation(): { entity: Model.Entity; relation: Model.ManyHasManyOwningRelation } {
		const entity = this.schema.model.entities[this.data.entityName]
		const relation = entity.fields[this.data.fieldName]
		if (!relation || relation.type !== Model.RelationType.ManyHasMany || !('joiningTable' in relation)) {
			throw new Error(`${this.data.entityName}.${this.data.fieldName} is not a many-has-many owning relation`)
		}
		return { entity, relation: relation as Model.ManyHasManyOwningRelation }
	}
}

/**
 * Contember installs a pure-SQL `public.uuid_generate_v4()` function during tenant setup,
 * so UUIDs can be generated without enabling any PostgreSQL extension.
 */
const UUID_GENERATOR = 'public."uuid_generate_v4"()'

export const convertManyHasManyToJoiningEntityModification = createModificationType({
	id: 'convertManyHasManyToJoiningEntity',
	handler: ConvertManyHasManyToJoiningEntityModificationHandler,
})

export interface ConvertManyHasManyToJoiningEntityModificationData {
	entityName: string
	fieldName: string
	joiningEntity: PossibleEntityShapeInMigrations
	sourceInverseSide?: Model.OneHasManyRelation
	targetInverseSide?: Model.OneHasManyRelation
}
