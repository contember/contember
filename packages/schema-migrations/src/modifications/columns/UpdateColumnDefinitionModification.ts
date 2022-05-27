import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'
import { updateColumns } from '../utils/diffUtils'
import { wrapIdentifier } from '@contember/database'

export class UpdateColumnDefinitionModificationHandler implements ModificationHandler<UpdateColumnDefinitionModificationData>  {
	constructor(protected readonly data: UpdateColumnDefinitionModificationData, protected readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		const field = entity.fields[this.data.fieldName] as Model.AnyColumn
		const definition = this.data.definition
		const newType = definition.columnType !== field.columnType
			? definition.type === Model.ColumnType.Enum
				? `"${definition.columnType}"`
				: definition.columnType
			: undefined
		builder.alterColumn(entity.tableName, field.columnName, {
			type: newType,
			notNull: field.nullable !== definition.nullable ? !definition.nullable : undefined,
			using: newType !== undefined ? `${wrapIdentifier(field.columnName)}::${newType}` : undefined,
			sequenceGenerated: field.sequence && !definition.sequence ? false : (!field.sequence ? definition.sequence : undefined),
		})

		const seqAlter = []
		if (field.sequence && definition.sequence) {
			if (field.sequence.precedence !== definition.sequence.precedence) {
				seqAlter.push(`SET GENERATED ${definition.sequence.precedence}`)
			}
			if (field.sequence.start !== definition.sequence.start && typeof definition.sequence.start == 'number') {
				seqAlter.push(`SET START WITH ${definition.sequence.start}`)
			}
			if (definition.sequence.restart) {
				seqAlter.push('RESTART')
			}
		}
		if (seqAlter.length > 0) {
			builder.sql(`ALTER TABLE ${wrapIdentifier(entity.tableName)} ALTER ${wrapIdentifier(field.columnName)} ${seqAlter.join(' ')}`)
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
