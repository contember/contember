import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { addField, removeField, SchemaUpdater, updateEntity, updateModel, updateSchema } from '../utils/schemaUpdateUtils.js'
import {
	createModificationType,
	ModificationHandler,
	ModificationHandlerCreateSqlOptions,
	ModificationHandlerOptions,
} from '../ModificationHandler.js'
import { createEventTrigger, createEventTrxTrigger, dropEventTrigger, dropEventTrxTrigger } from '../utils/sqlUpdateUtils.js'
import { getColumnSqlType } from '../utils/columnUtils.js'
import { wrapIdentifier } from '../../utils/dbHelpers.js'
import { VERSION_LATEST } from '../ModificationVersions.js'
import { PossibleEntityShapeInMigrations } from '../../utils/PartialEntity.js'

/**
 * Promotes an implicit many-has-many relation (backed by a junction table with a composite primary key)
 * into an explicit joining entity, while preserving all existing rows in the junction table.
 *
 * The junction table is reused in place — no data is copied:
 *  - a surrogate `id` (uuid) primary key column is added and back-filled (see {@link uuidGenerator}),
 *  - the original composite primary key is dropped and the new `id` becomes the primary key,
 *  - both foreign-key columns are kept and become two many-has-one relations of the new entity,
 *  - the `log_event` trigger is re-pointed from the two foreign-key columns onto the new `id` column
 *    (both event-log triggers are dropped up-front and re-created afterwards).
 *
 * The original many-has-many owning relation (and its inverse side, if any) is removed from the schema.
 *
 * Limitations / requirements:
 *  - The junction table is assumed to use the standard composite primary key produced by Contember.
 *  - UUID back-filling uses a pure-SQL `uuid_generate_v4()` function in the project's system schema,
 *    which the migration creates on the fly if missing (see {@link ensureUuidGenerator}). No
 *    PostgreSQL extension is created by this migration.
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

		// Drop BOTH event-log triggers before touching the table.
		// The deferred `log_event_trx` constraint trigger must go too: otherwise the back-fill UPDATE
		// below queues pending deferred trigger events, and PostgreSQL then rejects the subsequent
		// `ALTER TABLE` with "cannot ALTER TABLE because it has pending trigger events". Both are
		// re-created at the end, so there is no duplicate-trigger conflict either.
		if (joiningTable.eventLog.enabled) {
			dropEventTrigger(builder, tableName)
			dropEventTrxTrigger(builder, tableName)
		}

		// Add the surrogate primary key and back-fill it for existing rows.
		builder.sql(`ALTER TABLE ${tableNameId} ADD COLUMN ${primaryColumnNameId} ${primaryColumnType}`)
		builder.sql(ensureUuidGenerator(systemSchema))
		builder.sql(`UPDATE ${tableNameId} SET ${primaryColumnNameId} = ${uuidGenerator(systemSchema)}`)
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

		// Re-create both triggers: `log_event` is now re-pointed onto the surrogate primary key,
		// `log_event_trx` is restored unchanged (it takes no column params).
		if (joiningEntity.eventLog?.enabled !== false) {
			createEventTrigger(builder, systemSchema, tableName, [primaryColumnName])
			createEventTrxTrigger(builder, systemSchema, tableName)
		}
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entity, relation } = this.getRelation()
		const version = this.options.formatVersion ?? VERSION_LATEST
		const joiningEntity = this.data.joiningEntity
		const joinUniqueConstraint = this.getJoinUniqueConstraint()

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
						// Keep the schema in sync with the join-uniqueness constraint emitted by createSql.
						unique: [...Object.values(joiningEntity.unique ?? []), joinUniqueConstraint],
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

	/**
	 * The join-uniqueness constraint (relationA, relationB) that replaces the dropped composite
	 * primary key. The field names are resolved from the joining entity's two many-has-one relations
	 * by matching their joining columns against the original junction columns, so the constraint
	 * references schema field names (not raw column names).
	 */
	private getJoinUniqueConstraint(): Model.UniqueConstraint {
		const { relation } = this.getRelation()
		const joiningTable = relation.joiningTable
		const joiningEntity = this.data.joiningEntity

		const findRelationField = (columnName: string): string => {
			const field = Object.values(joiningEntity.fields).find((it): it is Model.AnyRelation & Model.JoiningColumnRelation =>
				'joiningColumn' in it && (it as Model.JoiningColumnRelation).joiningColumn.columnName === columnName
			)
			if (!field) {
				throw new Error(
					`Joining entity ${joiningEntity.name} has no many-has-one relation mapped to column ${columnName}`,
				)
			}
			return field.name
		}

		return {
			fields: [
				findRelationField(joiningTable.joiningColumn.columnName),
				findRelationField(joiningTable.inverseJoiningColumn.columnName),
			],
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
 * UUIDs are back-filled with a pure-SQL `uuid_generate_v4()` function kept in the project's system
 * schema, so no PostgreSQL extension is ever created. The function cannot be assumed to exist:
 * Contember's system migrations only materialize it on databases where `pg_catalog.gen_random_uuid`
 * is unavailable (i.e. PostgreSQL < 13), so on modern servers `system.uuid_generate_v4()` is absent.
 * {@link ensureUuidGenerator} therefore (idempotently) creates it in the system schema up-front. It
 * must be referenced through the system schema — it is not in `public` nor on the stage search_path.
 */
const uuidGenerator = (systemSchema: string) => `${wrapIdentifier(systemSchema)}."uuid_generate_v4"()`

/**
 * Idempotently materialize the pure-SQL `uuid_generate_v4()` function in the system schema. The body
 * matches the one Contember's `trigger-event-function` system migration installs, so the same
 * extension-free UUID generator is reused everywhere. Wrapped in a guard so re-running (or running on
 * a database where it already exists) is a no-op.
 */
const ensureUuidGenerator = (systemSchema: string) => {
	const systemSchemaId = wrapIdentifier(systemSchema)
	return `DO $ensure_uuid$
BEGIN
	IF NOT EXISTS(
		SELECT FROM pg_proc
		JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
		WHERE pg_namespace.nspname = ${quoteLiteral(systemSchema)} AND pg_proc.proname = 'uuid_generate_v4'
	) THEN
		CREATE FUNCTION ${systemSchemaId}."uuid_generate_v4"() RETURNS "uuid"
		LANGUAGE "sql"
		AS $ensure_uuid_body$
			SELECT OVERLAY(OVERLAY(md5(random()::TEXT || ':' || clock_timestamp()::TEXT) PLACING '4' FROM 13) PLACING
				to_hex(floor(random() * (11 - 8 + 1) + 8)::INT)::TEXT FROM 17)::UUID;
		$ensure_uuid_body$;
	END IF;
END
$ensure_uuid$;`
}

const quoteLiteral = (value: string) => `'${value.replace(/'/g, "''")}'`

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
