import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { addField, SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { createFields } from '../utils/diffUtils'
import { isInverseRelation, isRelation } from '@contember/schema-utils'

export class CreateRelationInverseSideModificationHandler implements ModificationHandler<CreateRelationInverseSideModificationData> {
	constructor(private readonly data: CreateRelationInverseSideModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, addField(this.data.relation)),
			updateEntity(
				this.data.relation.target,
				updateField<Model.AnyRelation & Model.OwningRelation>(this.data.relation.ownedBy, ({ field }) => ({
					...field,
					inversedBy: this.data.relation.name,
				})),
			),
		)
	}

	describe() {
		return { message: `Add relation ${this.data.entityName}.${this.data.relation.name}` }
	}
}

export interface CreateRelationInverseSideModificationData {
	entityName: string
	relation: Model.AnyRelation & Model.InverseRelation
}

export const createRelationInverseSideModification = createModificationType({
	id: 'createRelationInverseSide',
	handler: CreateRelationInverseSideModificationHandler,
})

export class CreateRelationInverseSideDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return createFields(originalSchema, updatedSchema, ({ newField, updatedEntity }) => {
			if (!isRelation(newField) || !isInverseRelation(newField)) {
				return undefined
			}
			return createRelationInverseSideModification.createModification({
				entityName: updatedEntity.name,
				relation: newField,
			})
		})
	}
}
