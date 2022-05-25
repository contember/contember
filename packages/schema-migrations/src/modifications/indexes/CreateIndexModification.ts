import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { acceptFieldVisitor } from '@contember/schema-utils'

export class CreateIndexModificationHandler implements ModificationHandler<CreateIndexModificationData> {
	constructor(private readonly data: CreateIndexModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		const fields = this.data.index.fields
		const columns = fields.map(fieldName => {
			return acceptFieldVisitor(this.schema.model, entity, fieldName, {
				visitColumn: ({}, column) => {
					return column.columnName
				},
				visitManyHasOne: ({}, relation) => {
					return relation.joiningColumn.columnName
				},
				visitOneHasOneOwning: ({}, relation) => {
					return relation.joiningColumn.columnName
				},
				visitOneHasMany: () => {
					throw new Error(`Cannot create index on 1:m relation in ${entity.name}.${fieldName}`)
				},
				visitOneHasOneInverse: () => {
					throw new Error(`Cannot create index on 1:1 inverse relation in ${entity.name}.${fieldName}`)
				},
				visitManyHasManyOwning: () => {
					throw new Error(`Cannot create index on m:m relation in ${entity.name}.${fieldName}`)
				},
				visitManyHasManyInverse: () => {
					throw new Error(`Cannot create index on m:m inverse relation in ${entity.name}.${fieldName}`)
				},
			})
		})
		builder.addIndex(entity.tableName, [...columns], {
			name: this.data.index.name,
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, ({ entity }) => ({
				...entity,
				indexes: {
					...entity.indexes,
					[this.data.index.name]: this.data.index,
				},
			})),
		)
	}

	describe() {
		return {
			message: `Create index(${this.data.index.fields.join(', ')}) on entity ${this.data.entityName}`,
		}
	}
}

export const createIndexModification = createModificationType({
	id: 'createIndex',
	handler: CreateIndexModificationHandler,
})

export class CreateIndexDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities).flatMap(entity =>
			Object.values(entity.indexes)
				.filter(it => !originalSchema.model.entities[entity.name].indexes[it.name])
				.map(index => createIndexModification.createModification({ entityName: entity.name, index })),
		)
	}
}

export interface CreateIndexModificationData {
	entityName: string
	index: Model.Index
}
