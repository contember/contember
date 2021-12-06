import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { isOwningRelation } from '@contember/schema-utils'
import { updateRelations } from '../utils/diffUtils'

export const DisableOrphanRemovalModification: ModificationHandlerStatic<DisableOrphanRemovalModificationData> = class {
	static id = 'disableOrphanRemoval'

	constructor(private readonly data: DisableOrphanRemovalModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.OneHasOneOwningRelation>(fieldName, ({ field: { orphanRemoval, ...field } }) => field),
			),
		)
	}

	describe() {
		return {
			message: `Disable orphan removal on ${this.data.entityName}.${this.data.fieldName}`,
		}
	}

	static createModification(data: DisableOrphanRemovalModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			if (
				isOwningRelation(originalRelation) &&
				isOwningRelation(updatedRelation) &&
				originalRelation.type === Model.RelationType.OneHasOne &&
				updatedRelation.type === Model.RelationType.OneHasOne &&
				originalRelation.orphanRemoval &&
				!updatedRelation.orphanRemoval
			) {
				return DisableOrphanRemovalModification.createModification({
					entityName: updatedEntity.name,
					fieldName: updatedRelation.name,
				})
			}
			return undefined
		})
	}
}
export interface DisableOrphanRemovalModificationData {
	entityName: string
	fieldName: string
}
