import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { isOwningRelation } from '@contember/schema-utils'
import { updateRelations } from '../utils/diffUtils'

export class DisableOrphanRemovalModificationHandler implements ModificationHandler<DisableOrphanRemovalModificationData> {

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
}

export interface DisableOrphanRemovalModificationData {
	entityName: string
	fieldName: string
}

export const disableOrphanRemovalModification = createModificationType({
	id: 'disableOrphanRemoval',
	handler: DisableOrphanRemovalModificationHandler,
})

export class DisableOrphanRemovalDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			if (
				isOwningRelation(originalRelation) &&
				isOwningRelation(updatedRelation) &&
				originalRelation.type === Model.RelationType.OneHasOne &&
				updatedRelation.type === Model.RelationType.OneHasOne &&
				originalRelation.orphanRemoval &&
				!updatedRelation.orphanRemoval
			) {
				return disableOrphanRemovalModification.createModification({
					entityName: updatedEntity.name,
					fieldName: updatedRelation.name,
				})
			}
			return undefined
		})
	}
}
