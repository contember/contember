import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils.js'
import { createModificationType, Differ, ModificationHandler, ModificationHandlerCreateSqlOptions } from '../ModificationHandler.js'
import { isIt } from '../../utils/isIt.js'
import { updateRelations } from '../utils/diffUtils.js'
import { acceptRelationTypeVisitor } from '@contember/schema-utils'
import { addForeignKeyConstraint } from './helpers.js'

export class UpdateRelationOnDeleteModificationHandler implements ModificationHandler<UpdateRelationOnDeleteModificationData> {
	constructor(
		private readonly data: UpdateRelationOnDeleteModificationData,
		private readonly schema: Schema,
	) {}

	public createSql(builder: MigrationBuilder, { databaseMetadata, invalidateDatabaseMetadata }: ModificationHandlerCreateSqlOptions): void {
		const updatedSchema = this.getSchemaUpdater()({ schema: this.schema })
		const entity = updatedSchema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}

		acceptRelationTypeVisitor(updatedSchema.model, entity, this.data.fieldName, {
			visitManyHasOne: ({ entity, relation, targetEntity }) => {
				addForeignKeyConstraint({ builder, entity, targetEntity, relation, recreate: true, databaseMetadata, invalidateDatabaseMetadata })
			},
			visitOneHasOneOwning: ({ entity, relation, targetEntity }) => {
				addForeignKeyConstraint({ builder, entity, targetEntity, relation, recreate: true, databaseMetadata, invalidateDatabaseMetadata })
			},
			visitOneHasMany: () => {},
			visitOneHasOneInverse: () => {},
			visitManyHasManyOwning: () => {},
			visitManyHasManyInverse: () => {},
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName, onDelete } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.AnyRelation & Model.JoiningColumnRelation>(fieldName, ({ field }) => ({
					...field,
					joiningColumn: { ...field.joiningColumn, onDelete },
				})),
			),
		)
	}

	describe() {
		return { message: `Change on-delete policy of relation ${this.data.entityName}.${this.data.fieldName}` }
	}
}

export interface UpdateRelationOnDeleteModificationData {
	entityName: string
	fieldName: string
	onDelete: Model.OnDelete
}

export const updateRelationOnDeleteModification = createModificationType({
	id: 'updateRelationOnDelete',
	handler: UpdateRelationOnDeleteModificationHandler,
})

export class UpdateRelationOnDeleteDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			if (
				originalRelation.type === updatedRelation.type
				&& isIt<Model.JoiningColumnRelation>(updatedRelation, 'joiningColumn')
				&& isIt<Model.JoiningColumnRelation>(originalRelation, 'joiningColumn')
				&& updatedRelation.joiningColumn.onDelete !== originalRelation.joiningColumn.onDelete
			) {
				return updateRelationOnDeleteModification.createModification({
					entityName: updatedEntity.name,
					fieldName: updatedRelation.name,
					onDelete: updatedRelation.joiningColumn.onDelete,
				})
			}
			return undefined
		})
	}
}
