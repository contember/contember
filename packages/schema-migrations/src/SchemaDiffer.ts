import { Model, Schema } from '@contember/schema'
import { acceptFieldVisitor, SchemaValidator, ValidationError } from '@contember/schema-utils'
import { isIt } from './utils/isIt'
import { SchemaMigrator } from './SchemaMigrator'
import ModificationBuilder from './modifications/ModificationBuilder'
import { Migration } from './Migration'
import { createPatch } from 'rfc6902'
import deepEqual from 'fast-deep-equal'
import deepCopy from './utils/deepCopy'
import { ImplementationException } from './exceptions'
import { VERSION_LATEST } from './modifications/ModificationVersions'
import { deepCompare } from '@contember/schema-utils'

export class SchemaDiffer {
	constructor(private readonly schemaMigrator: SchemaMigrator) {}

	diffSchemas(originalSchema: Schema, updatedSchema: Schema, checkRecreate: boolean = true): Migration.Modification[] {
		const originalErrors = SchemaValidator.validate(originalSchema)
		if (originalErrors.length > 0) {
			throw new InvalidSchemaException('original schema is not valid', originalErrors)
		}
		const updatedErrors = SchemaValidator.validate(updatedSchema)
		if (updatedErrors.length > 0) {
			throw new InvalidSchemaException('updated schema is not valid', updatedErrors)
		}

		const builder = new ModificationBuilder(originalSchema, updatedSchema)

		const originalModel = originalSchema.model
		const updatedModel = updatedSchema.model

		const originalEnums = new Set(Object.keys(originalModel.enums))

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
			const originalEntity: Model.Entity | undefined = originalModel.entities[entityName]

			if (!originalEntity) {
				builder.createEntity(updatedEntity)
				for (const fieldName in updatedEntity.fields) {
					if (fieldName === updatedEntity.primary) {
						continue
					}
					builder.createField(updatedEntity, fieldName)
				}
				for (const uniqueName in updatedEntity.unique) {
					builder.createUnique(updatedEntity, uniqueName)
				}
				continue
			}

			this.trackUniqueConstraintDiff(builder, originalEntity, updatedEntity)

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

				if (
					isIt<Model.NullableRelation>(updatedRelation, 'nullable') &&
					isIt<Model.NullableRelation>(originalRelation, 'nullable') &&
					!updatedRelation.nullable &&
					originalRelation.nullable
				) {
					;(tmpRelation as Model.AnyRelation & Model.NullableRelation).nullable = false
					builder.makeRelationNotNull(entityName, updatedRelation.name)
				}
				if (
					isIt<Model.NullableRelation>(updatedRelation, 'nullable') &&
					isIt<Model.NullableRelation>(originalRelation, 'nullable') &&
					updatedRelation.nullable &&
					!originalRelation.nullable
				) {
					;(tmpRelation as Model.AnyRelation & Model.NullableRelation).nullable = true
					builder.makeRelationNullable(entityName, updatedRelation.name)
				}

				const isItOrderable = (relation: Model.AnyRelation): relation is Model.OrderableRelation & Model.AnyRelation =>
					relation.type === Model.RelationType.ManyHasMany || relation.type === Model.RelationType.OneHasMany
				if (
					isItOrderable(updatedRelation) &&
					isItOrderable(originalRelation) &&
					!deepEqual(updatedRelation.orderBy || [], originalRelation.orderBy || [])
				) {
					;(tmpRelation as Model.AnyRelation & Model.OrderableRelation).orderBy = updatedRelation.orderBy || []
					builder.updateRelationOrderBy(entityName, updatedRelation.name, updatedRelation.orderBy || [])
				}

				if (!deepEqual(tmpRelation, updatedRelation)) {
					marker.rewind()
					return false
				}

				return true
			}

			const originalFields = new Set(Object.keys(originalEntity.fields))
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
								const {
									name: {},
									columnName: {},
									...updatedDefinition
								} = updatedColumn
								const {
									name: {},
									columnName: {},
									...originalDefinition
								} = originalColumn

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
										{ ...originalRelation, inversedBy: undefined },
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

		const entitiesToDelete = Object.keys(originalModel.entities).filter(name => !updatedModel.entities[name])
		for (const entityName of entitiesToDelete) {
			builder.removeEntity(entityName)
		}

		const enumsToDelete = Object.keys(originalModel.enums).filter(name => !updatedModel.enums[name])
		for (const enumName of enumsToDelete) {
			builder.removeEnum(enumName)
		}

		const partiallyMigratedSchema = this.schemaMigrator.applyModifications(
			originalSchema,
			builder.getDiff(),
			VERSION_LATEST,
		)

		if (!deepEqual(partiallyMigratedSchema.acl, updatedSchema.acl)) {
			const patch = createPatch(partiallyMigratedSchema.acl, updatedSchema.acl)
			if (patch.length <= 100) {
				builder.patchAclSchema(patch)
			} else {
				builder.updateAclSchema(updatedSchema.acl)
			}
		}

		if (!deepEqual(partiallyMigratedSchema.validation, updatedSchema.validation)) {
			const patch = createPatch(partiallyMigratedSchema.validation, updatedSchema.validation)
			if (patch.length <= 20) {
				builder.patchValidationSchema(patch)
			} else {
				builder.updateValidationSchema(updatedSchema.validation)
			}
		}

		const diff = builder.getDiff()

		const schemaWithAppliedModifications = this.schemaMigrator.applyModifications(originalSchema, diff, VERSION_LATEST)

		if (checkRecreate && !deepEqual(updatedSchema, schemaWithAppliedModifications)) {
			const errors = deepCompare(updatedSchema, schemaWithAppliedModifications, [])
			let message = 'Updated schema cannot be recreated by the generated diff:'
			for (const err of errors) {
				message += '\n\t' + err.path.join('.') + ': ' + err.message
			}
			message += '\n\nPlease fill a bug report'
			throw new ImplementationException(message)
		}

		return diff
	}

	private trackUniqueConstraintDiff(
		builder: ModificationBuilder,
		originalEntity: Model.Entity,
		updatedEntity: Model.Entity,
	) {
		const originalUnique = originalEntity.unique
		const originalUniqueNames = new Set(Object.keys(originalUnique))

		for (const uniqueName in updatedEntity.unique) {
			if (
				originalUniqueNames.has(uniqueName) &&
				!deepEqual(updatedEntity.unique[uniqueName], originalUnique[uniqueName])
			) {
				builder.removeUnique(updatedEntity.name, uniqueName)
				originalUniqueNames.delete(uniqueName)
			}
			if (!originalUniqueNames.has(uniqueName)) {
				builder.createUnique(updatedEntity, uniqueName)
			}
			originalUniqueNames.delete(uniqueName)
		}

		for (const uniqueName of originalUniqueNames) {
			builder.removeUnique(updatedEntity.name, uniqueName)
		}
	}
}

export class InvalidSchemaException extends Error {
	constructor(message: string, public readonly validationErrors: ValidationError[]) {
		super(message)
	}
}
