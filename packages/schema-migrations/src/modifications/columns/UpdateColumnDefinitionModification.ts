import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'
import { updateColumns } from '../utils/diffUtils'
import { wrapIdentifier } from '@contember/database'
import { getColumnSqlType } from '../utils/columnUtils'

export class UpdateColumnDefinitionModificationHandler implements ModificationHandler<UpdateColumnDefinitionModificationData>  {
	constructor(private readonly data: UpdateColumnDefinitionModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		const oldColumn = entity.fields[this.data.fieldName] as Model.AnyColumn
		const newColumn = this.data.definition
		const newType = newColumn.columnType !== oldColumn.columnType
			? getColumnSqlType(newColumn)
			: undefined

		builder.alterColumn(entity.tableName, oldColumn.columnName, {
			type: newType,
			notNull: oldColumn.nullable !== newColumn.nullable ? !newColumn.nullable : undefined,
			using: newType !== undefined ? `${wrapIdentifier(oldColumn.columnName)}::${newType}` : undefined,
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
	& Model.AnyColumn
	& {
		sequence?: SequenceDefinitionAlter
	}

export interface UpdateColumnDefinitionModificationData {
	entityName: string
	fieldName: string
	definition: ColumnDefinitionAlter
}

export const updateColumnDefinitionModification = createModificationType({
	id: 'updateColumnDefinition',
	handler: UpdateColumnDefinitionModificationHandler,
})

export class UpdateColumnDefinitionDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateColumns(originalSchema, updatedSchema, ({ originalColumn, updatedColumn, updatedEntity }) => {
			const {
				name: {},
				columnName: {},
				...updatedDefinition
			} = updatedColumn as any
			const {
				name: {},
				columnName: {},
				...originalDefinition
			} = originalColumn as any
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
