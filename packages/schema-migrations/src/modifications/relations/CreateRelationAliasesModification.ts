import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { updateRelations } from '../utils/diffUtils'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'

export class CreateRelationAliasesHandler implements ModificationHandler<CreateRelationAliasesModificationData> {
	constructor(
		private readonly data: CreateRelationAliasesModificationData,
	) { }

	public createSql(_builder: MigrationBuilder): void {
		// Alias is a schema-level concept and doesn't require SQL changes
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName, aliases } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.AnyRelation & Model.JoiningColumnRelation>(fieldName, ({ field }) => ({
					...field,
					aliases,
				})),
			),
		)
	}

	describe() {
		const { entityName, fieldName, aliases } = this.data

		if (aliases.length === 1) {
			return { message: `Create alias ${aliases[0]} to relation ${entityName}.${fieldName}` }
		}

		return { message: `Create aliases ${aliases.join(', ')} to relation ${entityName}.${fieldName}` }
	}
}

export interface CreateRelationAliasesModificationData {
	entityName: string
	fieldName: string
	aliases: readonly string[]
}

export const createRelationAliasesModification = createModificationType({
	id: 'createRelationAliases',
	handler: CreateRelationAliasesHandler,
})


export class CreateRelationAliasesDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			if (originalRelation.type === updatedRelation.type) {
				const originalAliases = originalRelation.aliases
				const updatedAliases = updatedRelation.aliases

				if (originalAliases === undefined && updatedAliases === undefined) {
					return undefined
				}

				if (originalAliases === undefined && updatedAliases !== undefined) {
					return createRelationAliasesModification.createModification({
						entityName: updatedEntity.name,
						fieldName: updatedRelation.name,
						aliases: updatedAliases,
					})
				}
			}
			return undefined
		})
	}
}
