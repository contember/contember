import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { acceptFieldVisitor } from '@contember/schema-utils'

export class CreateUniqueConstraintModificationHandler implements ModificationHandler<CreateUniqueConstraintModificationData> {
	constructor(protected readonly data: CreateUniqueConstraintModificationData, protected readonly schema: Schema) {
	}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		const fields = this.data.unique.fields
		const columns = fields.map(fieldName => {
			return acceptFieldVisitor(this.schema.model, entity, fieldName, {
				visitColumn: ({}, column) => {
					return column.columnName
				},
				visitManyHasOne: ({}, relation) => {
					return relation.joiningColumn.columnName
				},
				visitOneHasMany: () => {
					throw new Error(`Cannot create unique key on 1:m relation in ${entity.name}.${fieldName}`)
				},
				visitOneHasOneOwning: () => {
					throw new Error(
						`Cannot create unique key on 1:1 relation, this relation has unique key by default in ${entity.name}.${fieldName}`,
					)
				},
				visitOneHasOneInverse: () => {
					throw new Error(`Cannot create unique key on 1:1 inverse relation in ${entity.name}.${fieldName}`)
				},
				visitManyHasManyOwning: () => {
					throw new Error(`Cannot create unique key on m:m relation in ${entity.name}.${fieldName}`)
				},
				visitManyHasManyInverse: () => {
					throw new Error(`Cannot create unique key on m:m inverse relation in ${entity.name}.${fieldName}`)
				},
			})
		})
		builder.addConstraint(entity.tableName, this.data.unique.name, { unique: columns })
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, ({ entity }) => ({
				...entity,
				unique: {
					...entity.unique,
					[this.data.unique.name]: this.data.unique,
				},
			})),
		)
	}

	describe({ createdEntities }: { createdEntities: string[] }) {
		return {
			message: `Create unique constraint (${this.data.unique.fields.join(', ')}) on entity ${this.data.entityName}`,
			failureWarning: !createdEntities.includes(this.data.entityName)
				? 'Make sure no conflicting rows exists, otherwise this may fail in runtime.'
				: undefined,
		}
	}

}

export interface CreateUniqueConstraintModificationData {
	entityName: string
	unique: Model.UniqueConstraint
}

export const createUniqueConstraintModification = createModificationType({
	id: 'createUniqueConstraint',
	handler: CreateUniqueConstraintModificationHandler,
})

export class CreateUniqueConstraintDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities).flatMap(entity =>
			Object.values(entity.unique)
				.filter(it => !originalSchema.model.entities[entity.name].unique[it.name])
				.map(unique => createUniqueConstraintModification.createModification({
					entityName: entity.name,
					unique,
				})),
		)
	}
}
