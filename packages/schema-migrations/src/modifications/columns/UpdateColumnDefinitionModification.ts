import { escapeValue, MigrationBuilder } from '@contember/database-migrations'
import { JSONValue, Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'
import { updateColumns } from '../utils/diffUtils'
import { wrapIdentifier } from '../../utils/dbHelpers'
import { getColumnSqlType } from '../utils/columnUtils'
import { formatSeedExpression } from './helpers'

export class UpdateColumnDefinitionModificationHandler implements ModificationHandler<UpdateColumnDefinitionModificationData>  {
	constructor(private readonly data: UpdateColumnDefinitionModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const model = this.schema.model
		const entity = model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		const oldColumn = entity.fields[this.data.fieldName] as Model.AnyColumn
		const newColumn = this.data.definition

		const hasNewSequence = !oldColumn.sequence && newColumn.sequence
		const hasNewType = newColumn.columnType !== oldColumn.columnType

		const columnType = getColumnSqlType(newColumn)
		const seedExpression = formatSeedExpression({
			columnType,
			entity,
			model,
			copyValue: this.data.copyValue,
			fillValue: this.data.fillValue,
		})

		const usingCast = `${wrapIdentifier(oldColumn.columnName)}::${columnType}`

		builder.alterColumn(entity.tableName, oldColumn.columnName, {
			type: hasNewSequence || hasNewType || seedExpression !== null ? columnType : undefined,
			notNull: oldColumn.nullable !== newColumn.nullable ? !newColumn.nullable : undefined,
			using: (() => {
				if (hasNewSequence) {
					return `COALESCE(${usingCast}, nextval(PG_GET_SERIAL_SEQUENCE(${escapeValue(entity.tableName)}, ${escapeValue(oldColumn.columnName)})))`
				}
				if (seedExpression !== null) {
					return `COALESCE(${usingCast}, ${seedExpression})`
				}
				if (hasNewType) {
					return usingCast
				}
				return undefined
			})(),
			sequenceGenerated: oldColumn.sequence && !newColumn.sequence ? false : (!oldColumn.sequence ? newColumn.sequence : undefined),
		})

		const seqAlter = []
		if (oldColumn.sequence && newColumn.sequence) {
			if (oldColumn.sequence.precedence !== newColumn.sequence.precedence) {
				seqAlter.push(`SET GENERATED ${newColumn.sequence.precedence}`)
			}
			if (oldColumn.sequence.start !== newColumn.sequence.start && typeof newColumn.sequence.start == 'number') {
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
