import { Model } from '@contember/schema'
import { ErrorBuilder, ValidationError } from './errors'
import { acceptEveryFieldVisitor, getTargetEntity, isInverseRelation, isOwningRelation } from '../model'

const IDENTIFIER_PATTERN = /^[_a-zA-Z][_a-zA-Z0-9]*$/
const RESERVED_WORDS = ['and', 'or', 'not']


export class ModelValidator {
	constructor(private readonly model: Model.Schema) {}

	public validate(): ValidationError[] {
		const errorBuilder = new ErrorBuilder([], [])
		this.validateEnums(this.model.enums, errorBuilder.for('enums'))
		this.validateEntities(this.model.entities, errorBuilder.for('entities'))
		this.validateCollisions(Object.values(this.model.entities), errorBuilder.for('entities'))
		return errorBuilder.errors
	}

	private validateEnums(enums: Model.Schema['enums'], errors: ErrorBuilder): void {
		for (const [enumName, enum_] of Object.entries(enums)) {
			for (const value of enum_.values) {
				const valueErrors = errors.for(enumName, value)
				this.validateIdentifier(value, valueErrors)
			}
		}
	}

	private validateEntities(entities: Model.Schema['entities'], errors: ErrorBuilder): void {
		for (const [entityName, entity] of Object.entries(entities)) {
			const entityErrors = errors.for(entityName)
			if (entity.name !== entityName) {
				entityErrors.add(`Entity name "${entity.name}" does not match the name in a map "${entityName}"`)
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
				fieldErrors.add(`Field name "${field.name}" does not match the name in a map "${fieldName}"`)
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
				uniqueErrors.add(`Constraint name ${constraint.name} does not match the name in a map "${constraintName}"`)
				continue
			}
			for (const field of constraint.fields) {
				if (!fields.has(field)) {
					uniqueErrors.add(`Referenced field ${field} in a constraint does not exists`)
				}
			}
		}
	}

	private validateField(partialEntity: Model.Entity, field: Model.AnyField, errors: ErrorBuilder): void {
		this.validateIdentifier(field.name, errors)
		if (isRelation(field)) {
			this.validateRelation(partialEntity, field, errors)
		}
	}

	private validateRelation(partialEntity: Model.Entity, field: Model.AnyRelation, errors: ErrorBuilder):  void {
		const entityName = partialEntity.name
		const targetEntityName = field.target
		const targetEntity = this.model.entities[targetEntityName] || undefined
		if (!targetEntity) {
			return errors.add(`Target entity ${targetEntityName} not found`)
		}
		if (((it: Model.AnyRelation): it is Model.AnyRelation & Model.OrderableRelation => 'orderBy' in it)(field)) {
			(field as Model.OrderableRelation).orderBy?.forEach(it => {
				let entity = targetEntity

				for (let i = 0; i < it.path.length; i++) {
					const orderByField = entity.fields[it.path[i]]
					const pathStr = it.path.slice(0, i + 1).join('.')
					if (!orderByField) {
						errors.add(`Invalid orderBy of ${entityName}::${field.name}: field ${pathStr} is not defined`)
						return
					}
					if (i + 1 < it.path.length) {
						const targetEntity = getTargetEntity(this.model, entity, orderByField.name)
						if (!targetEntity) {
							errors.add(`Invalid orderBy of ${entityName}::${field.name}: field ${pathStr} is not a relation`)
							return
						}
						entity = targetEntity
					}
				}
			})
		}
		if (partialEntity.view) {
			if (field.type === Model.RelationType.ManyHasMany) {
				return errors.add('Many-has-many relation is not allowed on a view entity.')
			}
			if (
				!targetEntity.view &&
				field.type === Model.RelationType.OneHasMany
			) {
				return errors.add('One-has-many relation fields on views must point to a view entity.')
			}
			if (
				!targetEntity.view &&
				field.type === Model.RelationType.OneHasOne && 
				!('joiningColumn' in field)
			) {
				return errors.add('One-has-one relation fields on views must be owning or point to a view entity.')
			}
		}
		if (isInverseRelation(field)) {
			const ownedBy = field.ownedBy
			const targetField = targetEntity.fields[ownedBy]
			const relationDescription = `Target relation ${targetEntityName}::${ownedBy}:`
			if (!targetField) {
				return errors.add(`${relationDescription} not exists`)
			}

			if (!isRelation(targetField)) {
				return errors.add(`${relationDescription} not a relation`)
			}
			if (targetField.target !== entityName) {
				return errors.add(`${relationDescription} back reference to entity ${entityName} expected, but ${targetField.target} given`)
			}
			if (!isOwningRelation(targetField)) {
				errors.add(`${relationDescription} not an owning relation`)
				return
			}
			if (!targetField.inversedBy) {
				return errors.add(`${relationDescription} inverse relation is not set`)
			}
			if (targetField.inversedBy !== field.name) {
				return errors.add(`${relationDescription} back reference ${entityName}::${field.name} exepcted, ${targetField.target}::${targetField.inversedBy} given`)
			}
			if (field.type === Model.RelationType.OneHasOne && targetField.type !== Model.RelationType.OneHasOne) {
				return errors.add(`${relationDescription} "OneHasOne" type expected, "${targetField.type}" given`)
			}
			if (field.type === Model.RelationType.OneHasMany && targetField.type !== Model.RelationType.ManyHasOne) {
				return errors.add(`${relationDescription} "ManyHasOne" type expected, "${targetField.type}" given`)
			}
			if (field.type === Model.RelationType.ManyHasMany && targetField.type !== Model.RelationType.ManyHasMany) {
				return errors.add(`${relationDescription} "ManyHasMany" type expected, "${targetField.type}" given`)
			}
		} else {
			const inversedBy = field.inversedBy
			if (targetEntity.view) {
				if ('joiningColumn' in field) {
					return errors.add(`View entity ${targetEntity.name} cannot be referenced from an owning relation. Try switching the owning side.`)
				}
			}
			if (inversedBy) {
				const targetField = targetEntity.fields[inversedBy]
				const relationDescription = `Target relation ${targetEntityName}::${inversedBy}:`
				if (!targetField) {
					return errors.add(`${relationDescription} not exists`)
				}
				if (!isRelation(targetField)) {
					return errors.add(`${relationDescription} not a relation`)
				}
				if (targetField.target !== entityName) {
					return errors.add(`${relationDescription} back reference to entity ${entityName} expected, but ${targetField.target} given`)
				}
				if (!isInverseRelation(targetField)) {
					return errors.add(`${relationDescription} not an inverse relation`)
				}
				if (!targetField.ownedBy) {
					return errors.add(`${relationDescription} owning relation is not set`)
				}
				if (targetField.ownedBy !== field.name) {
					return errors.add(`${relationDescription} back reference ${entityName}::${field.name} exepcted, ${targetField.target}::${targetField.ownedBy} given`)
				}
				if (field.type === Model.RelationType.OneHasOne && targetField.type !== Model.RelationType.OneHasOne) {
					return errors.add(`${relationDescription} "OneHasOne" type expected, "${targetField.type}" given`)
				}
				if (field.type === Model.RelationType.ManyHasOne && targetField.type !== Model.RelationType.OneHasMany) {
					return errors.add(`${relationDescription} "ManyHasOne" type expected, "${targetField.type}" given`)
				}
				if (field.type === Model.RelationType.ManyHasMany && targetField.type !== Model.RelationType.ManyHasMany) {
					return errors.add(`${relationDescription} "ManyHasMany" type expected, "${targetField.type}" given`)
				}
			}
		}
	}

	private validateIdentifier(value: string, errorBuilder: ErrorBuilder) {
		if (!value.match(IDENTIFIER_PATTERN)) {
			return errorBuilder.add(`${value} must match pattern ${IDENTIFIER_PATTERN.source}`)
		}
		if (RESERVED_WORDS.includes(value)) {
			errorBuilder.add(`${value} is reserved word`)
		}
	}

	private validateCollisions(entities: Model.Entity[], errorBuilder: ErrorBuilder) {
		const tableNames: Record<string, string> = {}
		const aliasedTypes = new Map<string, Model.ColumnType>()
		for (const entity of entities) {
			const description = `entity ${entity.name}`
			if (tableNames[entity.tableName]) {
				errorBuilder
					.for(entity.name)
					.add(`Table name ${entity.tableName} of ${description} collides with a table name of ${tableNames[entity.tableName]}`)
			} else {
				tableNames[entity.tableName] = description
			}
		}
		for (const entity of entities) {
			const entityErrorBuilder = errorBuilder.for(entity.name)
			acceptEveryFieldVisitor(this.model, entity, {
				visitManyHasManyOwning: (entity, relation) => {
					const joiningTable = relation.joiningTable
					const description = `relation ${entity.name}::${relation.name}`
					if (tableNames[joiningTable.tableName]) {
						entityErrorBuilder
							.for(relation.name)
							.add(
								`Joining table name ${joiningTable.tableName} of ${description} collides with a table name of ${tableNames[joiningTable.tableName]}.` +
								'Consider using plural for a relation name or change the joining table name using .joiningTable(...) in schema definition.',
							)
					} else {
						tableNames[joiningTable.tableName] = description
					}
				},
				visitColumn: (entity, column) => {
					if (!column.typeAlias) {
						return
					}
					if (aliasedTypes.has(column.typeAlias) && aliasedTypes.get(column.typeAlias) !== column.type) {
						errorBuilder
							.for(column.name)
							.add(`Type alias ${column.typeAlias} already exists for base type ${column.type}`)
					}
					aliasedTypes.set(column.typeAlias, column.type)
				},
				visitManyHasManyInverse: () => {},
				visitOneHasMany: () => {},
				visitOneHasOneInverse: () => {},
				visitOneHasOneOwning: () => {},
				visitManyHasOne: () => {},
			})
		}
	}
}

const isRelation = (field: Model.AnyField): field is Model.AnyRelation =>
	Object.values(Model.RelationType).includes(field.type as Model.RelationType)
