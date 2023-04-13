import { Model } from '@contember/schema'
import { ErrorBuilder, ValidationError } from './errors'
import { acceptEveryFieldVisitor, getTargetEntity, isInverseRelation, isOwningRelation } from '../model'

const IDENTIFIER_PATTERN = /^[_a-zA-Z][_a-zA-Z0-9]*$/
const RESERVED_WORDS = ['and', 'or', 'not']


export class ModelValidator {
	constructor(private readonly model: Model.Schema) { }

	public validate(): ValidationError[] {
		const errorBuilder = new ErrorBuilder([], [])
		this.validateEnums(this.model.enums, errorBuilder.for('enums'))
		this.validateEntities(this.model.entities, errorBuilder.for('entities'))
		this.validateCollisions(Object.values(this.model.entities), errorBuilder.for('entities'))
		return errorBuilder.errors
	}

	private validateEnums(enums: Model.Schema['enums'], errors: ErrorBuilder): void {
		for (const [enumName, enumValues] of Object.entries(enums)) {
			for (const value of enumValues) {
				const valueErrors = errors.for(enumName, value)
				this.validateIdentifier(value, valueErrors)
			}
		}
	}

	private validateEntities(entities: Model.Schema['entities'], errors: ErrorBuilder): void {
		for (const [entityName, entity] of Object.entries(entities)) {
			const entityErrors = errors.for(entityName)
			if (entity.name !== entityName) {
				entityErrors.add('MODEL_NAME_MISMATCH', `Entity name "${entity.name}" does not match the name in a map "${entityName}"`)
			}
			this.validateEntity(entity, entityErrors)
		}
	}

	private validateEntity(entity: Model.Entity, errors: ErrorBuilder): void {
		this.validateIdentifier(entity.name, errors)

		for (const [fieldName, field] of Object.entries(entity.fields)) {
			const fieldErrors = errors.for(fieldName)
			this.validateField(entity, field, fieldErrors)
			if (field.name !== fieldName) {
				fieldErrors.add('MODEL_NAME_MISMATCH', `Field name "${field.name}" does not match the name in a map "${fieldName}"`)
			}
		}
		this.validateUniqueConstraints(
			entity.unique,
			new Set(Object.keys(entity.fields)),
			errors.for('unique'),
		)
	}

	private validateUniqueConstraints(uniqueConstraints: Model.Entity['unique'], fields: Set<string>, errors: ErrorBuilder): void {
		for (const [constraintName, constraint] of Object.entries(uniqueConstraints)) {
			const uniqueErrors = errors.for(constraintName)
			if (constraint.name !== constraintName) {
				uniqueErrors.add('MODEL_NAME_MISMATCH', `Constraint name ${constraint.name} does not match the name in a map "${constraintName}"`)
				continue
			}
			for (const field of constraint.fields) {
				if (!fields.has(field)) {
					uniqueErrors.add('MODEL_UNDEFINED_FIELD', `Referenced field ${field} in a constraint does not exists`)
				}
			}
		}
	}

	private validateField(partialEntity: Model.Entity, field: Model.AnyField, errors: ErrorBuilder): void {
		this.validateIdentifier(field.name, errors)
		if (isRelation(field)) {
			this.validateRelation(partialEntity, field, errors)
		} else {
			if (field.sequence && field.nullable) {
				errors.add('MODEL_INVALID_COLUMN_DEFINITION', 'Column with sequence cannot be nullable.')
			}
		}
	}

	private validateRelation(partialEntity: Model.Entity, field: Model.AnyRelation, errors: ErrorBuilder): void {
		const entityName = partialEntity.name
		const targetEntityName = field.target
		const targetEntity = this.model.entities[targetEntityName] || undefined
		if (!targetEntity) {
			return errors.add('MODEL_UNDEFINED_ENTITY', `Target entity ${targetEntityName} not found`)
		}
		if (((it: Model.AnyRelation): it is Model.AnyRelation & Model.OrderableRelation => 'orderBy' in it)(field)) {
			(field as Model.OrderableRelation).orderBy?.forEach(it => {
				let entity = targetEntity

				for (let i = 0; i < it.path.length; i++) {
					const orderByField = entity.fields[it.path[i]]
					const pathStr = it.path.slice(0, i + 1).join('.')
					if (!orderByField) {
						errors.add('MODEL_UNDEFINED_FIELD', `Invalid orderBy of ${entityName}::${field.name}: field ${pathStr} is not defined`)
						return
					}
					if (i + 1 < it.path.length) {
						const targetEntity = getTargetEntity(this.model, entity, orderByField.name)
						if (!targetEntity) {
							errors.add('MODEL_RELATION_REQUIRED', `Invalid orderBy of ${entityName}::${field.name}: field ${pathStr} is not a relation`)
							return
						}
						entity = targetEntity
					}
				}
			})
		}
		if (partialEntity.view) {
			if (field.type === Model.RelationType.ManyHasMany) {
				return errors.add('MODEL_INVALID_VIEW_USAGE', 'Many-has-many relation is not allowed on a view entity.')
			}
			if (
				!targetEntity.view &&
				field.type === Model.RelationType.OneHasMany
			) {
				return errors.add('MODEL_INVALID_VIEW_USAGE', 'One-has-many relation fields on views must point to a view entity.')
			}
			if (
				!targetEntity.view &&
				field.type === Model.RelationType.OneHasOne &&
				!('joiningColumn' in field)
			) {
				return errors.add('MODEL_INVALID_VIEW_USAGE', 'One-has-one relation fields on views must be owning or point to a view entity.')
			}
		}
		if (isInverseRelation(field)) {
			const ownedBy = field.ownedBy
			const targetField = targetEntity.fields[ownedBy]
			const relationDescription = `Target relation ${targetEntityName}::${ownedBy}:`
			if (!targetField) {
				return errors.add('MODEL_UNDEFINED_FIELD', `${relationDescription} not exists`)
			}

			if (!isRelation(targetField)) {
				return errors.add('MODEL_RELATION_REQUIRED', `${relationDescription} not a relation`)
			}
			if (targetField.target !== entityName) {
				return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} back reference to entity ${entityName} expected, but ${targetField.target} given`)
			}
			if (!isOwningRelation(targetField)) {
				errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} not an owning relation`)
				return
			}
			if (!targetField.inversedBy) {
				return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} inverse relation is not set`)
			}
			if (targetField.inversedBy !== field.name) {
				return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} back reference ${entityName}::${field.name} expected, ${targetField.target}::${targetField.inversedBy} given`)
			}
			if (field.type === Model.RelationType.OneHasOne && targetField.type !== Model.RelationType.OneHasOne) {
				return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} "OneHasOne" type expected, "${targetField.type}" given`)
			}
			if (field.type === Model.RelationType.OneHasMany && targetField.type !== Model.RelationType.ManyHasOne) {
				return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} "ManyHasOne" type expected, "${targetField.type}" given`)
			}
			if (field.type === Model.RelationType.ManyHasMany && targetField.type !== Model.RelationType.ManyHasMany) {
				return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} "ManyHasMany" type expected, "${targetField.type}" given`)
			}
		} else {
			const inversedBy = field.inversedBy
			if (targetEntity.view) {
				if ('joiningColumn' in field) {
					return errors.add('MODEL_INVALID_VIEW_USAGE', `View entity ${targetEntity.name} cannot be referenced from an owning relation. Try switching the owning side.`)
				}
			}
			if (inversedBy) {
				const targetField = targetEntity.fields[inversedBy]
				const relationDescription = `Target relation ${targetEntityName}::${inversedBy}:`
				if (!targetField) {
					return errors.add('MODEL_UNDEFINED_FIELD', `${relationDescription} not exists`)
				}
				if (!isRelation(targetField)) {
					return errors.add('MODEL_RELATION_REQUIRED', `${relationDescription} not a relation`)
				}
				if (targetField.target !== entityName) {
					return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} back reference to entity ${entityName} expected, but ${targetField.target} given`)
				}
				if (!isInverseRelation(targetField)) {
					return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} not an inverse relation`)
				}
				if (!targetField.ownedBy) {
					return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} owning relation is not set`)
				}
				if (targetField.ownedBy !== field.name) {
					return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} back reference ${entityName}::${field.name} expected, ${targetField.target}::${targetField.ownedBy} given`)
				}
				if (field.type === Model.RelationType.OneHasOne && targetField.type !== Model.RelationType.OneHasOne) {
					return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} "OneHasOne" type expected, "${targetField.type}" given`)
				}
				if (field.type === Model.RelationType.ManyHasOne && targetField.type !== Model.RelationType.OneHasMany) {
					return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} "ManyHasOne" type expected, "${targetField.type}" given`)
				}
				if (field.type === Model.RelationType.ManyHasMany && targetField.type !== Model.RelationType.ManyHasMany) {
					return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} "ManyHasMany" type expected, "${targetField.type}" given`)
				}
			}
		}
	}

	private validateIdentifier(value: string, errorBuilder: ErrorBuilder) {
		if (!value.match(IDENTIFIER_PATTERN)) {
			return errorBuilder.add('MODEL_INVALID_IDENTIFIER', `${value} must match pattern ${IDENTIFIER_PATTERN.source}`)
		}
		if (RESERVED_WORDS.includes(value)) {
			errorBuilder.add('MODEL_INVALID_IDENTIFIER', `${value} is reserved word`)
		}
	}

	private validateCollisions(entities: Model.Entity[], errorBuilder: ErrorBuilder) {
		const relationNames: Record<string, string> = {}
		const aliasedTypes = new Map<string, Model.ColumnType>()
		const entityNames = new Set(entities.map(it => it.name))
		for (const entity of entities) {
			const description = `table name ${entity.tableName} of entity ${entity.name}`
			if (relationNames[entity.tableName]) {
				errorBuilder
					.for(entity.name)
					.add('MODEL_NAME_COLLISION', `${description} collides with a ${relationNames[entity.tableName]}`)
			} else {
				relationNames[entity.tableName] = description
			}

			if (entity.name.endsWith('Meta')) {
				const baseName = entity.name.substring(0, entity.name.length - 4)
				if (entityNames.has(baseName)) {
					errorBuilder.for(entity.name)
						.add('MODEL_NAME_COLLISION', `entity ${entity.name} collides with entity ${baseName}, because a GraphQL type with "Meta" suffix is created for every entity`)
				}
			}
		}
		for (const entity of entities) {
			const entityErrorBuilder = errorBuilder.for(entity.name)
			acceptEveryFieldVisitor(this.model, entity, {
				visitManyHasManyOwning: ({ entity, relation }) => {
					const joiningTable = relation.joiningTable
					const description = `joining table name ${joiningTable.tableName} of relation ${entity.name}::${relation.name}`
					if (relationNames[joiningTable.tableName]) {
						entityErrorBuilder
							.for(relation.name)
							.add('MODEL_NAME_COLLISION',
								`${description} collides with a ${relationNames[joiningTable.tableName]}.` +
								'Consider using plural for a relation name or change the joining table name using .joiningTable(...) in schema definition.',
							)
					} else {
						relationNames[joiningTable.tableName] = description
					}
				},
				visitColumn: ({ entity, column }) => {
					if (!column.typeAlias) {
						return
					}
					if (aliasedTypes.has(column.typeAlias) && aliasedTypes.get(column.typeAlias) !== column.type) {
						errorBuilder
							.for(column.name)
							.add('MODEL_NAME_COLLISION', `Type alias ${column.typeAlias} already exists for base type ${column.type}`)
					}
					aliasedTypes.set(column.typeAlias, column.type)
				},
				visitManyHasManyInverse: () => { },
				visitOneHasMany: () => { },
				visitOneHasOneInverse: () => { },
				visitOneHasOneOwning: () => { },
				visitManyHasOne: () => { },
			})
		}
		for (const entity of entities) {
			const entityErrorBuilder = errorBuilder.for(entity.name)
			for (const index of Object.values(entity.indexes)) {
				const description = `index name ${index.name} of entity ${entity.name}`
				if (relationNames[index.name]) {
					entityErrorBuilder.add('MODEL_NAME_COLLISION', `${description} collides with ${relationNames[index.name]}`)
				} else {
					relationNames[index.name] = description
				}
			}
			for (const unique of Object.values(entity.unique)) {
				const description = `unique index name ${unique.name} of entity ${entity.name}`
				if (relationNames[unique.name]) {
					entityErrorBuilder.add('MODEL_NAME_COLLISION', `${description} collides with ${relationNames[unique.name]}`)
				} else {
					relationNames[unique.name] = description
				}
			}
		}
	}
}

const isRelation = (field: Model.AnyField): field is Model.AnyRelation =>
	Object.values(Model.RelationType).includes(field.type as Model.RelationType)
