import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'
import { updateColumns } from '../utils/diffUtils'

export const UpdateColumnDefinitionModification: ModificationHandlerStatic<UpdateColumnDefinitionModificationData> = class {
	static id = 'updateColumnDefinition'
	constructor(private readonly data: UpdateColumnDefinitionModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		const field = entity.fields[this.data.fieldName] as Model.AnyColumn
		const definition = this.data.definition
		builder.alterColumn(entity.tableName, field.columnName, {
			type:
				definition.columnType !== field.columnType
					? definition.type === Model.ColumnType.Enum
						? `"${definition.columnType}"`
						: definition.columnType
					: undefined,
			notNull: field.nullable !== definition.nullable ? !definition.nullable : undefined,
		})
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

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events // todo transform type
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

	static createModification(data: UpdateColumnDefinitionModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
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
			return UpdateColumnDefinitionModification.createModification({
				entityName: updatedEntity.name,
				fieldName: updatedColumn.name,
				definition: updatedDefinition,
			})
		})
	}
}

export interface UpdateColumnDefinitionModificationData {
	entityName: string
	fieldName: string
	definition: Model.AnyColumn
}
