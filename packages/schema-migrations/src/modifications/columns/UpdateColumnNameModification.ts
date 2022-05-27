import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { updateColumns } from '../utils/diffUtils'
import { acceptFieldVisitor } from '@contember/schema-utils'

export class UpdateColumnNameModificationHandler implements ModificationHandler<UpdateColumnNameModificationData> {
	constructor(protected readonly data: UpdateColumnNameModificationData, protected readonly schema: Schema) {
	}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		acceptFieldVisitor(this.schema.model, entity, this.data.fieldName, {
			visitColumn: (entity, column) => {
				builder.renameColumn(entity.tableName, column.columnName, this.data.columnName)
			},
			visitManyHasOne: (entity, relation) => {
				builder.renameColumn(entity.tableName, relation.joiningColumn.columnName, this.data.columnName)
			},
			visitOneHasOneOwning: (entity, relation) => {
				builder.renameColumn(entity.tableName, relation.joiningColumn.columnName, this.data.columnName)
			},
			visitManyHasManyInverse: () => {
				throw new Error('Cannot rename column of many-to-many relation')
			},
			visitManyHasManyOwning: () => {
				throw new Error('Cannot rename column of many-to-many relation')
			},
			visitOneHasMany: () => {
				throw new Error('Cannot rename column of one-to-many relation')
			},
			visitOneHasOneInverse: () => {
				throw new Error('Cannot rename column of one-to-one inverse relation')
			},
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(
				this.data.entityName,
				updateField(this.data.fieldName, ({
													  field,
													  entity,
												  }) => acceptFieldVisitor<Model.AnyField>(this.schema.model, entity, field, {
					visitColumn: (entity, column) => {
						return {
							...column,
							columnName: this.data.columnName,
						}
					},
					visitManyHasOne: (entity, relation) => {
						return {
							...relation,
							joiningColumn: {
								...relation.joiningColumn,
								columnName: this.data.columnName,
							},
						}
					},
					visitOneHasOneOwning: (entity, relation) => {
						return {
							...relation,
							joiningColumn: {
								...relation.joiningColumn,
								columnName: this.data.columnName,
							},
						}
					},
					visitManyHasManyInverse: () => {
						throw new Error('Cannot rename column of many-to-many relation')
					},
					visitManyHasManyOwning: () => {
						throw new Error('Cannot rename column of many-to-many relation')
					},
					visitOneHasMany: () => {
						throw new Error('Cannot rename column of one-to-many relation')
					},
					visitOneHasOneInverse: () => {
						throw new Error('Cannot rename column of one-to-one inverse relation')
					},
				})),
			),
		)
	}

	describe() {
		return { message: `Change column name of field ${this.data.entityName}.${this.data.fieldName}` }
	}
}

export interface UpdateColumnNameModificationData {
	entityName: string
	fieldName: string
	columnName: string
}

export const updateColumnNameModification = createModificationType({
	id: 'updateColumnName',
	handler: UpdateColumnNameModificationHandler,
})

export class UpdateColumnNameDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateColumns(originalSchema, updatedSchema, ({ originalColumn, updatedColumn, updatedEntity }) => {
			if (originalColumn.columnName === updatedColumn.columnName) {
				return undefined
			}
			return updateColumnNameModification.createModification({
				entityName: updatedEntity.name,
				fieldName: updatedColumn.name,
				columnName: updatedColumn.columnName,
			})
		})
	}
}
