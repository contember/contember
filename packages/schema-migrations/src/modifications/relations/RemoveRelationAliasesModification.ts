import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { updateRelations } from '../utils/diffUtils'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'

export class RemoveRelationAliasesHandler implements ModificationHandler<RemoveRelationAliasesModificationData> {
	constructor(
		private readonly data: RemoveRelationAliasesModificationData,
	) { }

	public createSql(_builder: MigrationBuilder): void {
		// Alias is a schema-level concept and doesn't require SQL changes
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.AnyRelation & Model.JoiningColumnRelation>(fieldName, ({ field }) => {
					const updatedField = { ...field }
					delete (updatedField as any).aliases
					return updatedField
				}),
			),
		)
	}

	describe() {
		const { entityName, fieldName, aliases } = this.data

		if (aliases.length === 1) {
			return { message: `Remove alias ${aliases[0]} from relation ${entityName}.${fieldName}` }
		}

		return { message: `Remove aliases ${aliases.join(', ')} from relation ${entityName}.${fieldName}` }
	}
}

export interface RemoveRelationAliasesModificationData {
	entityName: string
	fieldName: string
	aliases: readonly string[]
}

export const removeRelationAliasesModification = createModificationType({
	id: 'removeRelationAliases',
	handler: RemoveRelationAliasesHandler,
})


export class RemoveRelationAliasesDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			if (originalRelation.type === updatedRelation.type) {
				const originalAliases = originalRelation.aliases
				const updatedAliases = updatedRelation.aliases

				if (originalAliases === undefined && updatedAliases === undefined) {
					return undefined
				}

				if (originalAliases !== undefined && updatedAliases === undefined) {
					return removeRelationAliasesModification.createModification({
						entityName: updatedEntity.name,
						fieldName: updatedRelation.name,
						aliases: originalAliases,
					})
				}
			}

			return undefined
		})
	}
}
