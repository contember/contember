import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateModel, updateEntity, updateField } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { Migration } from '../../Migration'

export interface BaseAnnotationModificationData {
	entityName: string
	fieldName?: string
}

export type AnnotationModificationData<T extends string> = BaseAnnotationModificationData & {
	[K in T]?: string
}

export interface AnnotationConfig<T extends string> {
	id: string
	annotationField: T
	displayName: string
}

export function createAnnotationModification<T extends string>(config: AnnotationConfig<T>) {
	const { id, annotationField, displayName } = config

	class AnnotationModificationHandler implements ModificationHandler<AnnotationModificationData<T>> {
		constructor(public readonly data: AnnotationModificationData<T>, public readonly schema: Schema) {}

		public createSql(_builder: MigrationBuilder): void {
			// Annotations are schema-level concepts and don't require SQL changes
		}

		public getSchemaUpdater(): SchemaUpdater {
			const { entityName, fieldName } = this.data
			const annotationValue = this.data[annotationField]

			return updateModel(
				updateEntity(
					entityName,
					fieldName
						? updateField(fieldName, ({ field }) => {
							if (annotationValue !== undefined) {
								return {
									...field,
									[annotationField]: annotationValue,
								}
							} else {
								const { [annotationField]: _, ...fieldWithoutAnnotation } = field as any
								return fieldWithoutAnnotation
							}
						})
						: (({ entity }) => {
							if (annotationValue !== undefined) {
								return {
									...entity,
									[annotationField]: annotationValue,
								}
							} else {
								const { [annotationField]: _, ...entityWithoutAnnotation } = entity as any
								return entityWithoutAnnotation
							}
						}),
				),
			)
		}

		describe() {
			const { entityName, fieldName } = this.data
			const annotationValue = this.data[annotationField]
			const target = fieldName ? `field ${entityName}.${fieldName}` : `entity ${entityName}`

			return { message: `Set ${displayName} for ${target} "${annotationValue}"` }
		}
	}

	class AnnotationDiffer implements Differ {
		createDiff(originalSchema: Schema, updatedSchema: Schema) {
			const modifications: Migration.Modification[] = []

			for (const [entityName, updatedEntity] of Object.entries(updatedSchema.model.entities)) {
				const originalEntity = originalSchema.model.entities[entityName]

				if (!originalEntity) {
					continue
				}

				const originalEntityAnnotation = (originalEntity as any)[annotationField]
				const updatedEntityAnnotation = (updatedEntity as any)[annotationField]

				if (originalEntityAnnotation !== updatedEntityAnnotation) {
					modifications.push(annotationModification.createModification({
						entityName,
						[annotationField]: updatedEntityAnnotation,
					} as AnnotationModificationData<T>))
				}

				for (const [fieldName, updatedField] of Object.entries(updatedEntity.fields)) {
					const originalField = originalEntity.fields[fieldName]

					if (!originalField) {
						continue
					}

					const originalFieldAnnotation = (originalField as any)[annotationField]
					const updatedFieldAnnotation = (updatedField as any)[annotationField]

					if (originalFieldAnnotation !== updatedFieldAnnotation) {
						modifications.push(annotationModification.createModification({
							entityName,
							fieldName,
							[annotationField]: updatedFieldAnnotation,
						} as AnnotationModificationData<T>))
					}
				}
			}

			return modifications
		}
	}

	const annotationModification = createModificationType({
		id,
		handler: AnnotationModificationHandler,
	})

	return {
		handler: AnnotationModificationHandler,
		differ: AnnotationDiffer,
		modification: annotationModification,
	}
}
