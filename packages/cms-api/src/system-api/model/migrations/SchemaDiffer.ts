import { deepCopy, Model, Schema } from 'cms-common'
import { acceptFieldVisitor } from '../../../content-schema/modelUtils'
import ImplementationException from '../../../core/exceptions/ImplementationException'
import SchemaMigrator from '../../../content-schema/differ/SchemaMigrator'
import ModificationBuilder from './modifications/ModificationBuilder'
import Migration from './Migration'
import deepEqual = require('fast-deep-equal')
import { isIt } from '../../../utils/type'
import { createPatch } from 'rfc6902'

class SchemaDiffer {
	constructor(private readonly schemaMigrator: SchemaMigrator) {}

	diffSchemas(originalSchema: Schema, updatedSchema: Schema): Migration.Modification[] {
		const builder = new ModificationBuilder(updatedSchema)

		if (!deepEqual(originalSchema.acl, updatedSchema.acl)) {
			const patch = createPatch(originalSchema.acl, updatedSchema.acl)
			if (patch.length <= 20) {
				builder.patchAclSchema(patch)
			} else {
				builder.updateAclSchema(updatedSchema.acl)
			}
		}

		const originalModel = originalSchema.model
		const updatedModel = updatedSchema.model

		const originalEnums = new Set(Object.keys(originalModel.enums))
		const originalEntities = new Set(Object.keys(originalModel.entities))
		const toCreateUnique: { [entityName: string]: string[] } = {}

		for (const enumName in updatedModel.enums) {
			if (!originalEnums.has(enumName)) {
				builder.createEnum(enumName)
				continue
			}
			if (!deepEqual(updatedModel.enums[enumName], originalModel.enums[enumName])) {
				builder.updateEnum(enumName)
			}
			originalEnums.delete(enumName)
		}

		for (const entityName in updatedModel.entities) {
			const updatedEntity: Model.Entity = updatedModel.entities[entityName]

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

			const originalEntity: Model.Entity = originalModel.entities[entityName]
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

				acceptFieldVisitor(updatedModel, updatedEntity, fieldName, {
					visitColumn: ({}, updatedColumn: Model.AnyColumn) => {
						acceptFieldVisitor(originalModel, originalEntity, fieldName, {
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
						acceptFieldVisitor(originalModel, originalEntity, fieldName, {
							visitColumn: () => {
								builder.removeField(entityName, fieldName)
								builder.createField(updatedEntity, fieldName)
							},
							visitRelation: ({}, originalRelation: Model.AnyRelation, {}, _) => {
								if (
									deepEqual(
										{ ...updatedRelation, inversedBy: undefined },
										{ ...originalRelation, inversedBy: undefined }
									)
								) {
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
				acceptFieldVisitor(originalSchema.model, entityName, fieldName, {
					visitColumn: () => {
						builder.removeField(entityName, fieldName)
					},
					visitManyHasOne: () => {
						builder.removeField(entityName, fieldName)
					},
					visitOneHasMany: () => {
						builder.removeField(entityName, fieldName, true)
					},
					visitOneHasOneOwner: () => {
						builder.removeField(entityName, fieldName)
					},
					visitOneHasOneInversed: () => {
						builder.removeField(entityName, fieldName, true)
					},
					visitManyHasManyOwner: () => {
						builder.removeField(entityName, fieldName)
					},
					visitManyHasManyInversed: () => {
						builder.removeField(entityName, fieldName, true)
					},
				})
			}
		}

		for (const entityName in toCreateUnique) {
			for (const uniqueName of toCreateUnique[entityName]) {
				builder.createUnique(updatedModel.entities[entityName], uniqueName)
			}
		}

		for (const entityName of originalEntities) {
			builder.removeEntity(entityName)
		}

		for (const enumName of originalEnums) {
			builder.removeEnum(enumName)
		}

		const diff = builder.getDiff()

		const appliedDiff = this.schemaMigrator.applyDiff(originalSchema, diff)

		if (!deepEqual(updatedSchema, appliedDiff)) {
			throw new ImplementationException('Updated schema cannot be recreated by the generated diff!')
		}

		return diff
	}
}

export default SchemaDiffer
