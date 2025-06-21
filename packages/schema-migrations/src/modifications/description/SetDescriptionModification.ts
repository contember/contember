import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateModel, updateEntity, updateField } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { Migration } from '../../Migration'

export class SetDescriptionModificationHandler implements ModificationHandler<SetDescriptionModificationData> {
	constructor(private readonly data: SetDescriptionModificationData, private readonly schema: Schema) {}

	public createSql(_builder: MigrationBuilder): void {
		// Description is a schema-level concept and doesn't require SQL changes
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName, newDescription } = this.data

		if (fieldName) {
			return updateModel(
				updateEntity(
					entityName,
					updateField(fieldName, ({ field }) => {
						if (newDescription !== undefined) {
							// Set or update field description
							return {
								...field,
								description: newDescription,
							}
						} else {
							const { description, ...fieldWithoutDescription } = field
							return fieldWithoutDescription
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

				if (newDescription !== undefined) {
					return {
						...model,
						entities: {
							...model.entities,
							[entityName]: {
								...entity,
								description: newDescription,
							},
						},
					}
				} else {
					const { description, ...entityWithoutDescription } = entity
					return {
						...model,
						entities: {
							...model.entities,
							[entityName]: entityWithoutDescription,
						},
					}
				}
			})
		}
	}

	describe() {
		const { entityName, fieldName, oldDescription, newDescription } = this.data
		const target = fieldName ? `field ${entityName}.${fieldName}` : `entity ${entityName}`

		if (!oldDescription && newDescription) {
			return {
				message: `Add description "${newDescription}" to ${target}`,
			}
		} else if (oldDescription && newDescription) {
			return {
				message: `Update description for ${target} from "${oldDescription}" to "${newDescription}"`,
			}
		} else if (oldDescription && !newDescription) {
			return {
				message: `Remove description "${oldDescription}" from ${target}`,
			}
		} else {
			throw new Error(`Invalid description state for ${target}`)
		}
	}
}

export const setDescriptionModification = createModificationType({
	id: 'setDescriptionMessage',
	handler: SetDescriptionModificationHandler,
})

export class SetDescriptionDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		const modifications: Migration.Modification[] = []

		for (const [entityName, updatedEntity] of Object.entries(updatedSchema.model.entities)) {
			const originalEntity = originalSchema.model.entities[entityName]

			if (!originalEntity) {
				continue
			}

			const originalEntityDescription = originalEntity.description
			const updatedEntityDescription = updatedEntity.description

			if (originalEntityDescription !== updatedEntityDescription) {
				modifications.push(setDescriptionModification.createModification({
					entityName,
					oldDescription: originalEntityDescription,
					newDescription: updatedEntityDescription,
				}))
			}

			for (const [fieldName, updatedField] of Object.entries(updatedEntity.fields)) {
				const originalField = originalEntity.fields[fieldName]

				if (!originalField) {
					continue
				}

				const originalFieldDescription = originalField.description
				const updatedFieldDescription = updatedField.description

				if (originalFieldDescription !== updatedFieldDescription) {
					modifications.push(setDescriptionModification.createModification({
						entityName,
						fieldName,
						oldDescription: originalFieldDescription,
						newDescription: updatedFieldDescription,
					}))
				}
			}
		}

		return modifications
	}
}

export interface SetDescriptionModificationData {
	entityName: string
	fieldName?: string
	oldDescription?: string
	newDescription?: string
}
