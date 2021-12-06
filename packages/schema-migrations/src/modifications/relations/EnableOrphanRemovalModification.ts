import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { isOwningRelation } from '@contember/schema-utils'
import { updateRelations } from '../utils/diffUtils'

export const EnableOrphanRemovalModification: ModificationHandlerStatic<EnableOrphanRemovalModificationData> = class {
	static id = 'enableOrphanRemoval'
	constructor(private readonly data: EnableOrphanRemovalModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.OneHasOneOwningRelation>(fieldName, ({ field }) => ({
					...field,
					orphanRemoval: true,
				})),
			),
		)
	}

	describe() {
		return {
			message: `Enable orphan removal on ${this.data.entityName}.${this.data.fieldName}`,
		}
	}

	static createModification(data: EnableOrphanRemovalModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			if (
				isOwningRelation(originalRelation) &&
				isOwningRelation(updatedRelation) &&
				originalRelation.type === Model.RelationType.OneHasOne &&
				updatedRelation.type === Model.RelationType.OneHasOne &&
				!originalRelation.orphanRemoval &&
				updatedRelation.orphanRemoval
			) {
				return EnableOrphanRemovalModification.createModification({
					entityName: updatedEntity.name,
					fieldName: updatedRelation.name,
				})
			}
			return undefined
		})
	}
}

export interface EnableOrphanRemovalModificationData {
	entityName: string
	fieldName: string
}
