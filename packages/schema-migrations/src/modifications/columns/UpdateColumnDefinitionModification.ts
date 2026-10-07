import { escapeValue, MigrationBuilder } from '@contember/database-migrations'
import { JSONValue, Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils.js'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler.js'
import deepEqual from 'fast-deep-equal'
import { updateColumns } from '../utils/diffUtils.js'
import { wrapIdentifier } from '../../utils/dbHelpers.js'
import { getColumnSqlType } from '../utils/columnUtils.js'
import { fillSeed, formatSeedExpression } from './columnUtils.js'

export class UpdateColumnDefinitionModificationHandler implements ModificationHandler<UpdateColumnDefinitionModificationData> {
	constructor(private readonly data: UpdateColumnDefinitionModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		const oldColumn = entity.fields[this.data.fieldName] as Model.AnyColumn
		const newColumn = this.data.definition

		const hasNewSequence = !oldColumn.sequence && newColumn.sequence
		const oldColumnType = getColumnSqlType(oldColumn)
		const columnType = getColumnSqlType(newColumn)
		const hasNewType = columnType !== oldColumnType
		const hasNullableChanged = oldColumn.nullable !== newColumn.nullable
		const hasNewCollation = newColumn.collation !== oldColumn.collation

		const columnNameWrapped = wrapIdentifier(oldColumn.columnName)
		const isChangedToArray = !oldColumn.list && newColumn.list
		const usingCast = isChangedToArray
			? `CASE WHEN ${columnNameWrapped} IS NULL THEN ${
				newColumn.nullable ? 'NULL' : `ARRAY[]::${columnType}`
			} ELSE ARRAY[${columnNameWrapped}]::${columnType} END`
			: `${columnNameWrapped}::${columnType}`

		const seedExpression = formatSeedExpression({
			model: this.schema.model,
			entity,
			columnType,
			fillValue: this.data.fillValue,
			copyValue: this.data.copyValue,
		})
		const hasSeed = seedExpression !== null
		const migrateWithUsing = hasSeed && this.data.valueMigrationStrategy === 'using'
		const migrateWithUpdate = hasSeed && this.data.valueMigrationStrategy !== 'using'

		// Opt-in: unlike the rewrite, filling the empty rows goes through the event log and the triggers.
		const addSequenceWithUpdate = hasNewSequence && !hasNewType && !hasNewCollation && !hasSeed && this.data.valueMigrationStrategy === 'update'
		if (addSequenceWithUpdate) {
			addSequenceInPlace({
				builder,
				entity,
				column: oldColumn,
				sequence: hasNewSequence,
				notNull: hasNullableChanged ? !newColumn.nullable : undefined,
			})
			return
		}

		builder.alterColumn(entity.tableName, oldColumn.columnName, {
			collation: hasNewCollation ? wrapIdentifier(newColumn.collation || 'default') : undefined,
			type: hasNewCollation || hasNewSequence || hasNewType || migrateWithUsing ? columnType : undefined,
			notNull: hasNullableChanged && (!migrateWithUpdate || newColumn.nullable) ? !newColumn.nullable : undefined,
			using: (() => {
				if (hasNewSequence) {
					return `COALESCE(${usingCast}, nextval(PG_GET_SERIAL_SEQUENCE(${escapeValue(entity.tableName)}, ${escapeValue(oldColumn.columnName)})))`
				}
				if (migrateWithUsing) {
					return `COALESCE(${usingCast}, ${seedExpression})`
				}

				if (hasNewType) {
					return usingCast
				}
				return undefined
			})(),
			sequenceGenerated: oldColumn.sequence && !newColumn.sequence ? false : (!oldColumn.sequence ? newColumn.sequence : undefined),
		})

		if (migrateWithUpdate) {
			fillSeed({
				builder,
				type: 'updating',
				entity,
				columnName: oldColumn.columnName,
				nullable: newColumn.nullable,
				seedExpression,
			})
		}

		const seqAlter = []
		if (oldColumn.sequence && newColumn.sequence) {
			if (oldColumn.sequence.precedence !== newColumn.sequence.precedence) {
				seqAlter.push(`SET GENERATED ${newColumn.sequence.precedence}`)
			}
			if (oldColumn.sequence.start !== newColumn.sequence.start && typeof newColumn.sequence.start === 'number') {
				seqAlter.push(`SET START WITH ${newColumn.sequence.start}`)
			}
			if (newColumn.sequence.restart) {
				seqAlter.push('RESTART')
			}
		}
		if (seqAlter.length > 0) {
			builder.sql(`ALTER TABLE ${wrapIdentifier(entity.tableName)} ALTER ${wrapIdentifier(oldColumn.columnName)} ${seqAlter.join(' ')}`)
		}
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(
				this.data.entityName,
				updateField<Model.AnyColumn>(this.data.fieldName, ({ field }) => {
					return {
						...this.data.definition,
						name: field.name,
						columnName: field.columnName,
					}
				}),
			),
		)
	}

	describe() {
		const current = this.schema.model.entities[this.data.entityName].fields[this.data.fieldName] as Model.AnyColumn
		const changingToNotNull = current.nullable && !this.data.definition.nullable
		const failureWarning = changingToNotNull ? 'Changing to not-null may fail in runtime.' : undefined

		return {
			message: `Update column definition of field ${this.data.entityName}.${this.data.fieldName}`,
			failureWarning,
		}
	}
}

// Avoids `SET DATA TYPE … USING`, which rewrites the table and its indexes under an ACCESS EXCLUSIVE lock.
// Empty rows are numbered from the start in primary key order, as `nextval` did, so they can still collide
// with existing values in that range; later inserts continue after the highest value at or above the start.
const addSequenceInPlace = ({ builder, entity, column, sequence, notNull }: {
	builder: MigrationBuilder
	entity: Model.Entity
	column: Model.AnyColumn
	sequence: NonNullable<Model.AnyColumn['sequence']>
	notNull: boolean | undefined
}) => {
	const table = wrapIdentifier(entity.tableName)
	const columnName = wrapIdentifier(column.columnName)
	const primary = wrapIdentifier(entity.primaryColumn)
	const start = sequence.start ?? 1

	if (column.nullable) {
		builder.sql(`UPDATE ${table}
			SET ${columnName} = numbered.value
			FROM (
				SELECT ${primary}, ${start - 1} + ROW_NUMBER() OVER (ORDER BY ${primary}) AS value
				FROM ${table}
				WHERE ${columnName} IS NULL
			) AS numbered
			WHERE ${table}.${primary} = numbered.${primary}`)

		// event log uses deferred constraint triggers, we need to fire them before ALTER
		builder.sql(`SET CONSTRAINTS ALL IMMEDIATE`)
		builder.sql(`SET CONSTRAINTS ALL DEFERRED`)
	}

	builder.alterColumn(entity.tableName, column.columnName, {
		notNull,
		sequenceGenerated: sequence,
	})

	builder.sql(`SELECT SETVAL(PG_GET_SERIAL_SEQUENCE(${escapeValue(entity.tableName)}, ${escapeValue(column.columnName)}), MAX(${columnName}))
		FROM ${table}
		WHERE ${columnName} >= ${start}`)
}

type SequenceDefinitionAlter =
	& Model.AnyColumn['sequence']
	& {
		restart?: boolean
	}

type ColumnDefinitionAlter =
	& Omit<Model.AnyColumn, 'sequence' | 'columnName' | 'name'>
	& {
		sequence?: SequenceDefinitionAlter
	}

export interface UpdateColumnDefinitionModificationData {
	entityName: string
	fieldName: string
	definition: ColumnDefinitionAlter
	fillValue?: JSONValue
	copyValue?: string
	valueMigrationStrategy?: 'using' | 'update'
}

export const updateColumnDefinitionModification = createModificationType({
	id: 'updateColumnDefinition',
	handler: UpdateColumnDefinitionModificationHandler,
})

export class UpdateColumnDefinitionDiffer implements Differ<UpdateColumnDefinitionModificationData> {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateColumns(originalSchema, updatedSchema, ({ originalColumn, updatedColumn, updatedEntity }) => {
			const {
				name: {},
				columnName: {},
				...updatedDefinition
			} = updatedColumn
			const {
				name: {},
				columnName: {},
				...originalDefinition
			} = originalColumn
			if (deepEqual(updatedDefinition, originalDefinition)) {
				return undefined
			}

			return updateColumnDefinitionModification.createModification({
				entityName: updatedEntity.name,
				fieldName: updatedColumn.name,
				definition: updatedDefinition,
			})
		})
	}
}
