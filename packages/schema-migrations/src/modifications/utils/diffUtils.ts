import { Model, Schema } from '@contember/schema'
import { Migration } from '../../Migration'
import { isColumn, isRelation } from '@contember/schema-utils'
import { isDefined } from '../../utils/isDefined'
import deepEqual from 'fast-deep-equal'

export const updateFields = (
	originalSchema: Schema,
	updatedSchema: Schema,
	modificationGenerator: (args: {
		originalEntity: Model.Entity
		updatedEntity: Model.Entity
		originalField: Model.AnyField
		updatedField: Model.AnyField
	}) => Migration.Modification | Migration.Modification[] | undefined,
): Migration.Modification[] => {
	return Object.values(updatedSchema.model.entities)
		.filter(({ name }) => originalSchema.model.entities[name])
		.flatMap(updatedEntity => {
			const originalEntity = originalSchema.model.entities[updatedEntity.name]

			return Object.values(updatedEntity.fields)
				.flatMap(updatedField => {
					const originalField = originalEntity.fields[updatedField.name]
					if (!originalField) {
						return undefined
					}
					if (deepEqual(originalField, updatedField)) {
						return undefined
					}
					const result = modificationGenerator({
						originalEntity,
						updatedEntity,
						originalField,
						updatedField,
					})
					if (result !== undefined && !Array.isArray(result)) {
						return [result]
					}
					return result
				})
				.filter(isDefined)
		})
}

export const updateColumns = (
	originalSchema: Schema,
	updatedSchema: Schema,
	modificationGenerator: (args: {
		originalEntity: Model.Entity
		originalColumn: Model.AnyColumn
		updatedEntity: Model.Entity
		updatedColumn: Model.AnyColumn
	}) => Migration.Modification | undefined,
) => {
	return updateFields(
		originalSchema,
		updatedSchema,
		({ updatedEntity, originalEntity, originalField, updatedField }) => {
			if (!isColumn(updatedField) || !isColumn(originalField)) {
				return undefined
			}
			return modificationGenerator({
				originalEntity,
				updatedEntity,
				originalColumn: originalField,
				updatedColumn: updatedField,
			})
		},
	)
}

export const updateRelations = (
	originalSchema: Schema,
	updatedSchema: Schema,
	modificationGenerator: (args: {
		originalEntity: Model.Entity
		originalRelation: Model.AnyRelation
		updatedEntity: Model.Entity
		updatedRelation: Model.AnyRelation
	}) => Migration.Modification | undefined,
) => {
	return updateFields(
		originalSchema,
		updatedSchema,
		({ updatedEntity, originalEntity, originalField, updatedField }) => {
			if (!isRelation(updatedField) || !isRelation(originalField)) {
				return undefined
			}
			return modificationGenerator({
				originalEntity,
				updatedEntity,
				originalRelation: originalField,
				updatedRelation: updatedField,
			})
		},
	)
}

export const createFields = (
	originalSchema: Schema,
	updatedSchema: Schema,
	modificationGenerator: (args: {
		originalEntity: Model.Entity
		updatedEntity: Model.Entity
		newField: Model.AnyField
	}) => Migration.Modification | undefined,
) => {
	return Object.values(updatedSchema.model.entities)
		.filter(({ name }) => originalSchema.model.entities[name])
		.flatMap(updatedEntity => {
			const originalEntity = originalSchema.model.entities[updatedEntity.name]

			return Object.values(updatedEntity.fields)
				.filter(it => !originalEntity.fields[it.name])
				.map(newField => {
					return modificationGenerator({
						newField,
						updatedEntity,
						originalEntity,
					})
				})
				.filter(isDefined)
		})
}
