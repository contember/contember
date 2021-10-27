import { escapeValue, MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent, EventType } from '@contember/engine-common'
import { addField, SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { wrapIdentifier } from '../../utils/dbHelpers'
import { getColumnName, isColumn, isInverseRelation, isRelation, resolveDefaultValue } from '@contember/schema-utils'
import { ImplementationException } from '../../exceptions'
import { createFields } from '../utils/diffUtils'

export const CreateColumnModification: ModificationHandlerStatic<CreateColumnModificationData> = class {
	static id = 'createColumn'

	constructor(private readonly data: CreateColumnModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		const column = this.data.field
		const hasSeed = this.data.fillValue !== undefined || this.data.copyValue !== undefined
		builder.addColumn(entity.tableName, {
			[column.columnName]: {
				type: column.type === Model.ColumnType.Enum ? `"${column.columnType}"` : column.columnType,
				notNull: !column.nullable && !hasSeed,
			},
		})
		if (hasSeed) {
			if (this.data.fillValue !== undefined) {
				builder.sql(`UPDATE ${wrapIdentifier(entity.tableName)}
	  SET ${wrapIdentifier(column.columnName)} = ${escapeValue(this.data.fillValue)}`)
			} else if (this.data.copyValue !== undefined) {
				const copyFrom = getColumnName(this.schema.model, entity, this.data.copyValue)
				builder.sql(`UPDATE ${wrapIdentifier(entity.tableName)}
	  SET ${wrapIdentifier(column.columnName)} = ${wrapIdentifier(copyFrom)}`)
			} else {
				throw new ImplementationException()
			}

			// event applier defers constraint check, we need to fire them before ALTER
			builder.sql(`SET CONSTRAINTS ALL IMMEDIATE`)
			builder.sql(`SET CONSTRAINTS ALL DEFERRED`)

			if (!column.nullable) {
				builder.alterColumn(entity.tableName, column.columnName, {
					notNull: true,
				})
			}
		}
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(updateEntity(this.data.entityName, addField(this.data.field)))
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		const entity = this.schema.model.entities[this.data.entityName]

		return events.map(it => {
			if (it.tableName !== entity.tableName || it.type !== EventType.create) {
				return it
			}

			try {
				let value: any = null
				if (this.data.fillValue !== undefined) {
					value = this.data.fillValue
				} else if (this.data.copyValue !== undefined) {
					const columnName = getColumnName(this.schema.model, entity, this.data.copyValue)
					value = it.values[columnName] !== undefined ? it.values[columnName] : null
				} else {
					value = resolveDefaultValue(this.data.field, { now: () => it.createdAt })
				}
				return {
					...it,
					values: {
						...it.values,
						[this.data.field.columnName]: value,
					},
				}
			} catch (e) {
				// if (e instanceof NoDataError) {
				// 	return {...it, errors: [...it.errors || []]}
				// }
				throw e
			}
		})
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

	static createModification(data: CreateColumnModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return createFields(originalSchema, updatedSchema, ({ newField, updatedEntity }) => {
			if (!isColumn(newField)) {
				return undefined
			}
			return CreateColumnModification.createModification({
				entityName: updatedEntity.name,
				field: newField,
				...(newField.default !== undefined ? { fillValue: newField.default } : {}),
			})
		})
	}
}

export interface CreateColumnModificationData {
	entityName: string
	field: Model.AnyColumn
	fillValue?: any
	copyValue?: string
}
