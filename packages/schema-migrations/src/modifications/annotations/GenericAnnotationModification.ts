import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils.js'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler.js'
import { Migration } from '../../Migration.js'

export interface BaseAnnotationModificationData {
	entityName: string
	fieldName?: string
}

export type AnnotationField = keyof Model.AnyField & keyof Model.Entity

export type AnnotationModificationData<T extends AnnotationField> =
	& BaseAnnotationModificationData
	& {
		[K in T]?: string
	}

export interface AnnotationConfig<T extends AnnotationField> {
	id: string
	annotationField: T
	displayName: string
}

export function createAnnotationModification<T extends AnnotationField>(config: AnnotationConfig<T>) {
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
						? updateField(fieldName, ({ field }) => withAnnotation(field, annotationValue))
						: ({ entity }) => withAnnotation(entity, annotationValue),
				),
			)
		}

		public describe() {
			const { entityName, fieldName } = this.data
			const annotationValue = this.data[annotationField]
			const target = fieldName ? `field ${entityName}.${fieldName}` : `entity ${entityName}`

			if (annotationValue === undefined) {
				return { message: `Remove ${displayName} from ${target}` }
			}
			return { message: `Set ${displayName} for ${target} to "${annotationValue}"` }
		}
	}

	const withAnnotation = <E extends Model.AnyField | Model.Entity>(target: E, value: string | undefined): E => {
		const { [annotationField]: _, ...rest } = target
		return (value === undefined ? rest : { ...rest, [annotationField]: value }) as E
	}

	class AnnotationDiffer implements Differ {
		public createDiff(originalSchema: Schema, updatedSchema: Schema) {
			const modifications: Migration.Modification[] = []

			for (const [entityName, updatedEntity] of Object.entries(updatedSchema.model.entities)) {
				const originalEntity = originalSchema.model.entities[entityName]

				if (!originalEntity) {
					continue
				}

				if (originalEntity[annotationField] !== updatedEntity[annotationField]) {
					modifications.push(annotationModification.createModification(createData(entityName, undefined, updatedEntity[annotationField])))
				}

				for (const [fieldName, updatedField] of Object.entries(updatedEntity.fields)) {
					const originalField = originalEntity.fields[fieldName]

					if (!originalField) {
						continue
					}

					if (originalField[annotationField] !== updatedField[annotationField]) {
						modifications.push(annotationModification.createModification(createData(entityName, fieldName, updatedField[annotationField])))
					}
				}
			}

			return modifications
		}
	}

	const createData = (entityName: string, fieldName: string | undefined, value: string | undefined): AnnotationModificationData<T> => {
		const annotation = (value !== undefined ? { [annotationField]: value } : {}) as { [K in T]?: string }
		return {
			entityName,
			...(fieldName !== undefined ? { fieldName } : {}),
			...annotation,
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
