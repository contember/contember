import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateModel, updateEntity, updateField } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { Migration } from '../../Migration'

export class SetDeprecatedModificationHandler implements ModificationHandler<SetDeprecatedModificationData> {
	constructor(private readonly data: SetDeprecatedModificationData, private readonly schema: Schema) {}

	public createSql(_builder: MigrationBuilder): void {
		// Deprecation is a schema-level concept and doesn't require SQL changes
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName, newDeprecationReason } = this.data

		if (fieldName) {
			return updateModel(
				updateEntity(
					entityName,
					updateField(fieldName, ({ field }) => {
						if (newDeprecationReason !== undefined) {
							return {
								...field,
								deprecationReason: newDeprecationReason,
							}
						} else {
							const { deprecationReason, ...fieldWithoutDeprecation } = field
							return fieldWithoutDeprecation
						}
					}),
				),
			)
		} else {
			return updateModel(({ model }) => {
				const entity = model.entities[entityName]
				if (!entity) {
					throw new Error(`Entity ${entityName} not found`)
				}

				if (newDeprecationReason !== undefined) {
					return {
						...model,
						entities: {
							...model.entities,
							[entityName]: {
								...entity,
								deprecationReason: newDeprecationReason,
							},
						},
					}
				} else {
					const { deprecationReason, ...entityWithoutDeprecation } = entity
					return {
						...model,
						entities: {
							...model.entities,
							[entityName]: entityWithoutDeprecation,
						},
					}
				}
			})
		}
	}

	describe() {
		const { entityName, fieldName, oldDeprecationReason, newDeprecationReason } = this.data
		const target = fieldName ? `field ${entityName}.${fieldName}` : `entity ${entityName}`

		if (!oldDeprecationReason && newDeprecationReason) {
			return { message: `Add deprecation reason "${newDeprecationReason}" to ${target}` }
		} else if (oldDeprecationReason && newDeprecationReason) {
			return { message: `Update deprecation reason for ${target} from "${oldDeprecationReason}" to "${newDeprecationReason}"` }
		} else if (oldDeprecationReason && !newDeprecationReason) {
			return { message: `Remove deprecation reason "${oldDeprecationReason}" from ${target}` }
		} else {
			throw new Error(`Invalid state: ${target}`)
		}
	}
}

export const setDeprecatedModification = createModificationType({
	id: 'setDeprecationMessage',
	handler: SetDeprecatedModificationHandler,
})

export class SetDeprecatedDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		const modifications: Migration.Modification[] = []

		for (const [entityName, updatedEntity] of Object.entries(updatedSchema.model.entities)) {
			const originalEntity = originalSchema.model.entities[entityName]

			if (!originalEntity) {
				continue
			}

			const originalEntityDeprecation = originalEntity.deprecationReason
			const updatedEntityDeprecation = updatedEntity.deprecationReason

			if (originalEntityDeprecation !== updatedEntityDeprecation) {
				modifications.push(setDeprecatedModification.createModification({
					entityName,
					oldDeprecationReason: originalEntityDeprecation,
					newDeprecationReason: updatedEntityDeprecation,
				}))
			}

			for (const [fieldName, updatedField] of Object.entries(updatedEntity.fields)) {
				const originalField = originalEntity.fields[fieldName]

				// Skip if field doesn't exist in original schema (handled by other modifications)
				if (!originalField) {
					continue
				}

				const originalFieldDeprecation = originalField.deprecationReason
				const updatedFieldDeprecation = updatedField.deprecationReason

				// Only create modification if deprecation actually changed
				if (originalFieldDeprecation !== updatedFieldDeprecation) {
					modifications.push(setDeprecatedModification.createModification({
						entityName,
						fieldName,
						oldDeprecationReason: originalFieldDeprecation,
						newDeprecationReason: updatedFieldDeprecation,
					}))
				}
			}
		}

		return modifications
	}
}

export interface SetDeprecatedModificationData {
	entityName: string
	fieldName?: string
	oldDeprecationReason?: string
	newDeprecationReason?: string
}
