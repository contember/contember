import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { updateRelations } from '../utils/diffUtils'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'

export class UpdateRelationAliasesHandler implements ModificationHandler<UpdateRelationAliasesModificationData> {
	constructor(
		private readonly data: UpdateRelationAliasesModificationData,
	) { }

	public createSql(_builder: MigrationBuilder): void {
		// Alias is a schema-level concept and doesn't require SQL changes
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName, newAliases } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.AnyRelation & Model.JoiningColumnRelation>(fieldName, ({ field }) => ({
					...field,
					aliases: newAliases,
				})),
			),
		)
	}

	describe() {
		const { entityName, fieldName, newAliases, oldAliases } = this.data

		const oldAliasesText = oldAliases.length === 1
			? oldAliases[0]
			: oldAliases.join(', ')

		const newAliasesText = newAliases.length === 1
			? newAliases[0]
			: newAliases.join(', ')

		return {
			message: `Update aliases for relation ${entityName}.${fieldName} from ${oldAliasesText} to ${newAliasesText}`,
		}
	}
}

export interface UpdateRelationAliasesModificationData {
	entityName: string
	fieldName: string
	oldAliases: readonly string[]
	newAliases: readonly string[]
}

export const updateRelationAliasesModification = createModificationType({
	id: 'updateRelationAliases',
	handler: UpdateRelationAliasesHandler,
})

export class UpdateRelationAliasesDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ originalRelation, updatedRelation, updatedEntity }) => {
			if (originalRelation.type === updatedRelation.type) {
				const originalAliases = originalRelation.aliases
				const updatedAliases = updatedRelation.aliases

				if (originalAliases === undefined && updatedAliases === undefined) {
					return undefined
				}

				if (originalAliases !== undefined && updatedAliases !== undefined) {
					const arraysAreDifferent = (
						originalAliases.length !== updatedAliases.length ||
						!originalAliases.every(alias => updatedAliases.includes(alias)) ||
						!updatedAliases.every(alias => originalAliases.includes(alias))
					)

					if (arraysAreDifferent) {
						return updateRelationAliasesModification.createModification({
							entityName: updatedEntity.name,
							fieldName: updatedRelation.name,
							oldAliases: originalAliases,
							newAliases: updatedAliases,
						})
					}
				}
			}
			return undefined
		})
	}
}
