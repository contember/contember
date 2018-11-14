import { deepCopy, Model } from 'cms-common'
import { acceptFieldVisitor } from '../modelUtils'
import ImplementationException from '../../core/exceptions/ImplementationException'
import SchemaMigrator from './SchemaMigrator'
import { SchemaDiff } from './modifications'
import ModificationBuilder from './ModificationBuilder'
import deepEqual = require('fast-deep-equal')
import { isIt } from '../../utils/type'

export default function diffSchemas(originalSchema: Model.Schema, updatedSchema: Model.Schema): SchemaDiff | null {
	const builder = new ModificationBuilder(originalSchema, updatedSchema)

	const originalEnums = new Set(Object.keys(originalSchema.enums))
	const originalEntities = new Set(Object.keys(originalSchema.entities))
	const toCreateUnique: { [entityName: string]: string[] } = {}

	for (const enumName in updatedSchema.enums) {
		if (!originalEnums.has(enumName)) {
			builder.createEnum(enumName)
			continue
		}
		if (!deepEqual(updatedSchema.enums[enumName], originalSchema.enums[enumName])) {
			builder.updateEnum(enumName)
		}
		originalEnums.delete(enumName)
	}

	for (const entityName in updatedSchema.entities) {
		const updatedEntity: Model.Entity = updatedSchema.entities[entityName]

		toCreateUnique[entityName] = []

		if (!originalEntities.has(entityName)) {
			builder.createEntity(updatedEntity)
			for (const fieldName in updatedEntity.fields) {
				if (fieldName === updatedEntity.primary) {
					continue
				}
				builder.createField(updatedEntity, fieldName)
			}
			for (const uniqueName in updatedEntity.unique) {
				toCreateUnique[entityName].push(uniqueName)
			}
			continue
		}
		originalEntities.delete(entityName)

		const originalEntity: Model.Entity = originalSchema.entities[entityName]
		const originalFields = new Set(Object.keys(originalEntity.fields))
		const originalUnique = new Set(Object.keys(originalEntity.unique))

		for (const uniqueName in updatedEntity.unique) {
			if (
				originalUnique.has(uniqueName) &&
				!deepEqual(updatedEntity.unique[uniqueName], originalEntity.unique[uniqueName])
			) {
				builder.removeUnique(entityName, uniqueName)
				originalUnique.delete(uniqueName)
			}
			if (!originalUnique.has(uniqueName)) {
				toCreateUnique[entityName].push(uniqueName)
			}
			originalUnique.delete(uniqueName)
		}

		for (const uniqueName of originalUnique) {
			builder.removeUnique(entityName, uniqueName)
		}

		if (updatedEntity.tableName !== originalEntity.tableName) {
			builder.updateEntityTableName(entityName, updatedEntity.tableName)
		}

		const tryPartialUpdate = (updatedRelation: Model.AnyRelation, originalRelation: Model.AnyRelation): boolean => {
			if (updatedRelation.type !== originalRelation.type) {
				return false
			}
			const marker = builder.createMarker()
			const tmpRelation = deepCopy(originalRelation)
			if (
				isIt<Model.JoiningColumnRelation>(updatedRelation, 'joiningColumn') &&
				isIt<Model.JoiningColumnRelation>(originalRelation, 'joiningColumn') &&
				updatedRelation.joiningColumn.onDelete !== originalRelation.joiningColumn.onDelete
			) {
				;(tmpRelation as Model.AnyRelation & Model.JoiningColumnRelation).joiningColumn.onDelete =
					updatedRelation.joiningColumn.onDelete
				builder.updateRelationOnDelete(entityName, updatedRelation.name, updatedRelation.joiningColumn.onDelete)
			}

			if (!deepEqual(tmpRelation, updatedRelation)) {
				marker.rewind()
				return false
			}

			return true
		}

		for (const fieldName in updatedEntity.fields) {
			if (!originalFields.has(fieldName)) {
				builder.createField(updatedEntity, fieldName)
				continue
			}
			originalFields.delete(fieldName)

			acceptFieldVisitor(updatedSchema, updatedEntity, fieldName, {
				visitColumn: ({}, updatedColumn: Model.AnyColumn) => {
					acceptFieldVisitor(originalSchema, originalEntity, fieldName, {
						visitColumn: ({}, originalColumn: Model.AnyColumn) => {
							if (updatedColumn.columnName != originalColumn.columnName) {
								builder.updateColumnName(entityName, fieldName, updatedColumn.columnName)
							}
							const updatedDefinition = Model.getColumnDefinition(updatedColumn)
							const originalDefinition = Model.getColumnDefinition(originalColumn)
							if (!deepEqual(updatedDefinition, originalDefinition)) {
								builder.updateColumnDefinition(entityName, fieldName, updatedDefinition)
							}
						},
						visitRelation: () => {
							builder.removeField(entityName, fieldName)
							builder.createField(updatedEntity, fieldName)
						},
					})
				},
				visitRelation: ({}, updatedRelation: Model.AnyRelation, {}, _) => {
					acceptFieldVisitor(originalSchema, originalEntity, fieldName, {
						visitColumn: () => {
							builder.removeField(entityName, fieldName)
							builder.createField(updatedEntity, fieldName)
						},
						visitRelation: ({}, originalRelation: Model.AnyRelation, {}, _) => {
							if (deepEqual(updatedRelation, originalRelation)) {
								return
							}
							const partialUpdateResult = tryPartialUpdate(updatedRelation, originalRelation)

							if (!partialUpdateResult) {
								builder.removeField(entityName, fieldName)
								builder.createField(updatedEntity, fieldName)
							}
						},
					})
				},
			})
		}

		for (const fieldName of originalFields) {
			builder.removeField(entityName, fieldName)
		}
	}

	for (const entityName in toCreateUnique) {
		for (const uniqueName of toCreateUnique[entityName]) {
			builder.createUnique(updatedSchema.entities[entityName], uniqueName)
		}
	}

	for (const entityName of originalEntities) {
		builder.removeEntity(entityName)
	}

	for (const enumName of originalEnums) {
		builder.removeEnum(enumName)
	}

	const diff = builder.getDiff()

	const appliedDiff = diff === null ? updatedSchema : SchemaMigrator.applyDiff(originalSchema, diff)
	if (!deepEqual(updatedSchema, appliedDiff)) {
		throw new ImplementationException('Updated schema cannot be recreated by the generated diff!')
	}

	return diff
}
