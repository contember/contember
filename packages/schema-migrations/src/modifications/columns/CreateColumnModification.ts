import { MigrationBuilder } from '@contember/database-migrations'
import { JSONValue, Model, Schema } from '@contember/schema'
import { addField, SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { isColumn } from '@contember/schema-utils'
import { createFields } from '../utils/diffUtils'
import { getColumnSqlType } from '../utils/columnUtils'
import { fillSeed, formatSeedExpression } from './columnUtils'

export class CreateColumnModificationHandler implements ModificationHandler<CreateColumnModificationData> {
	constructor(private readonly data: CreateColumnModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		const column = this.data.field

		const columnType = getColumnSqlType(column)

		const seedExpression = formatSeedExpression({
			model: this.schema.model,
			entity,
			columnType,
			fillValue: this.data.fillValue,
			copyValue: this.data.copyValue,
		})


		builder.addColumn(entity.tableName, {
			[column.columnName]: {
				type: columnType,
				notNull: !column.nullable && seedExpression === null,
				sequenceGenerated: column.sequence,
				collation: column.collation,
			},
		})

		if (seedExpression !== null) {
			if (this.data.valueMigrationStrategy === 'using') {
				builder.alterColumn(entity.tableName, column.columnName, {
					notNull: !column.nullable ? true : undefined,
					type: columnType,
					using: seedExpression,
				})
			} else {
				fillSeed({
					builder,
					type: 'creating',
					entity,
					columnName: column.columnName,
					nullable: column.nullable,
					seedExpression,
				})
			}
		}
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(updateEntity(this.data.entityName, addField(this.data.field)))
	}

	describe({ createdEntities }: { createdEntities: string[] }) {
		const notNull = !this.data.field.nullable
		const hasValue = this.data.fillValue !== undefined || this.data.copyValue !== undefined
		const failureWarning =
			notNull && !hasValue && !createdEntities.includes(this.data.entityName)
				? 'May fail in runtime, because column is not-null. Consider setting fillValue or copyValue'
				: undefined
		return { message: `Add field ${this.data.entityName}.${this.data.field.name}`, failureWarning }
	}
}

export interface CreateColumnModificationData {
	entityName: string
	field: Model.AnyColumn
	fillValue?: JSONValue
	copyValue?: string
	valueMigrationStrategy?: 'using' | 'update'
}


export const createColumnModification = createModificationType({
	id: 'createColumn',
	handler: CreateColumnModificationHandler,
})

export class CreateColumnDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return createFields(originalSchema, updatedSchema, ({ newField, updatedEntity }) => {
			if (!isColumn(newField)) {
				return undefined
			}
			return createColumnModification.createModification({
				entityName: updatedEntity.name,
				field: newField,
				...(newField.default !== undefined ? { fillValue: newField.default, valueMigrationStrategy: 'using' } : {}),
			})
		})
	}
}
