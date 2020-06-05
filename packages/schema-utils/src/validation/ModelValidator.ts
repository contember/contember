import { Model } from '@contember/schema'
import { ErrorBuilder, ValidationError } from './errors'
import { everyIs, isObject, UnknownObject } from './utils'
import { getTargetEntity, isInversedRelation, isOwnerRelation } from '../model'

export class ModelValidator {
	constructor(private readonly model: Model.Schema) {}

	public validate(): [Model.Schema, ValidationError[]] {
		const model = this.model as unknown
		const errorBuilder = new ErrorBuilder([], [])
		let validModel: Model.Schema
		if (!isObject(model)) {
			errorBuilder.add('Must be an object')
			validModel = { entities: {}, enums: {} }
		} else {
			const enums = this.validateEnums(model.enums, errorBuilder.for('enums'))
			const entities = this.validateEntities(model.entities, errorBuilder.for('entities'))
			validModel = { enums, entities }
		}
		return [validModel, errorBuilder.errors]
	}

	private validateEnums(enums: unknown, errors: ErrorBuilder): Model.Schema['enums'] {
		if (!enums) {
			errors.add('Enums definitions are missing')
			return {}
		}
		if (!isObject(enums)) {
			errors.add('Enums must be an object')
			return {}
		}
		const validEnums: Model.Schema['enums'] = {}
		for (const [enumName, enumValues] of Object.entries(enums)) {
			if (!Array.isArray(enumValues) || !everyIs(enumValues, (it): it is string => typeof it === 'string')) {
				errors.for(enumName).add('Enum values must be an array of strings')
				continue
			}
			validEnums[enumName] = enumValues
		}
		return validEnums
	}

	private validateEntities(entities: unknown, errors: ErrorBuilder): Model.Schema['entities'] {
		if (!entities) {
			errors.add('Entities definitions are missing')
			return {}
		}
		if (!isObject(entities)) {
			errors.add('Entities must be an object')
			return {}
		}
		const validEntities: Model.Schema['entities'] = {}
		for (const [entityName, entity] of Object.entries(entities)) {
			const entityErrors = errors.for(entityName)
			const validEntity = this.validateEntity(entity, entityErrors)
			if (!validEntity) {
				continue
			}
			if (validEntity.name !== entityName) {
				entityErrors.add(`Entity name "${validEntity.name}" does not match the name in a map "${entityName}"`)
				continue
			}

			validEntities[entityName] = validEntity
		}
		return validEntities
	}

	private validateEntity(entity: unknown, errors: ErrorBuilder): Model.Entity | undefined {
		if (!isObject(entity)) {
			errors.add('Entity must be an object')
			return undefined
		}
		if (typeof entity.name !== 'string') {
			errors.for('name').add('Entity name must be a string')
			return undefined
		}
		if (typeof entity.primary !== 'string') {
			errors.for('primary').add('Primary must be a string')
			return undefined
		}
		if (typeof entity.primaryColumn !== 'string') {
			errors.for('primaryColumn').add('Primary column must be a string')
			return undefined
		}
		if (typeof entity.tableName !== 'string') {
			errors.for('tableName').add('Entity name must be a string')
			return undefined
		}
		const fields = entity.fields
		if (!isObject(fields)) {
			errors.add('Fields must be an object')
			return undefined
		}

		const validFields: Model.Entity['fields'] = {}
		for (const [fieldName, field] of Object.entries(fields)) {
			const fieldErrors = errors.for(fieldName)
			const validField = this.validateField(entity.name, field, fieldErrors)
			if (!validField) {
				continue
			}
			if (validField.name !== fieldName) {
				fieldErrors.add(`Field name "${validField.name}" does not match the name in a map "${fieldName}"`)
				continue
			}
			validFields[fieldName] = validField
		}

		const uniqueConstraints = entity.unique
		if (!isObject(uniqueConstraints)) {
			errors.add('Unique constraints must be an object')
			return undefined
		}
		const validUniqueConstraints = this.validateUniqueConstraints(
			uniqueConstraints,
			new Set(Object.keys(validFields)),
			errors.for('unique'),
		)

		return {
			name: entity.name,
			primary: entity.primary,
			primaryColumn: entity.primaryColumn,
			tableName: entity.tableName,
			fields: validFields,
			unique: validUniqueConstraints,
		}
	}

	private validateUniqueConstraints(
		uniqueConstraints: unknown,
		fields: Set<string>,
		errors: ErrorBuilder,
	): Model.Entity['unique'] {
		if (!isObject(uniqueConstraints)) {
			errors.add('Unique constraints must be an object')
			return {}
		}
		const validUniqueConstraints: Model.Entity['unique'] = {}
		constraint: for (const [constraintName, constraint] of Object.entries(uniqueConstraints)) {
			const uniqueErrors = errors.for(constraintName)
			if (!isObject(constraint)) {
				uniqueErrors.add('Unique constraint must be an object')
				continue
			}
			if (typeof constraint.name !== 'string') {
				uniqueErrors.add('Constraint name is not defined')
				continue
			}
			if (constraint.name !== constraintName) {
				uniqueErrors.add(`Constraint name ${constraint.name} does not match the name in a map "${constraintName}"`)
				continue
			}
			if (
				!Array.isArray(constraint.fields) ||
				!everyIs(constraint.fields, (it): it is string => typeof it === 'string')
			) {
				uniqueErrors.add('Every field must be a string')
				continue
			}
			for (const field of constraint.fields) {
				if (!fields.has(field)) {
					uniqueErrors.add(`Referenced field ${field} in a constraint does not exists`)
					continue constraint
				}
			}
			validUniqueConstraints[constraintName] = { name: constraint.name, fields: constraint.fields }
		}
		return validUniqueConstraints
	}

	private validateField(entityName: string, field: unknown, errors: ErrorBuilder): Model.AnyField | undefined {
		if (!isObject(field)) {
			errors.add('Field must be an object')
			return undefined
		}
		if (typeof field.type !== 'string') {
			errors.add('Field type must be a string')
			return undefined
		}
		if (isRelation(field as any)) {
			return this.validateRelation(entityName, field, errors)
		}
		return field as Model.AnyColumn
	}

	private validateRelation(
		entityName: string,
		field: UnknownObject,
		errors: ErrorBuilder,
	): Model.AnyRelation | undefined {
		const targetEntityName = field.target as string // todo
		const targetEntity = this.model.entities[targetEntityName] || undefined
		if (!targetEntity) {
			errors.add(`Target entity ${targetEntityName} not found`)
			return undefined
		}
		if (((it: Model.AnyRelation): it is Model.AnyRelation & Model.OrderableRelation => 'orderBy' in it)(field as any)) {
			;(field as Model.OrderableRelation).orderBy?.forEach(it => {
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
		if (isInversedRelation((field as any) as Model.Relation)) {
			// todo
			const ownedBy = field.ownedBy
			if (typeof ownedBy !== 'string') {
				errors.add('Owned by is not defined')
				return undefined
			}
			const targetField = targetEntity.fields[ownedBy]
			const relationDescription = `Target relation ${targetEntityName}::${ownedBy}:`
			if (!targetField) {
				errors.add(`${relationDescription} not exists`)
				return undefined
			}
			if (!isRelation(targetField)) {
				errors.add(`${relationDescription} not a relation`)
				return undefined
			}
			if (targetField.target !== entityName) {
				errors.add(
					`${relationDescription} back reference to entity ${entityName} expected, but ${targetField.target} given`,
				)
				return undefined
			}
			if (!isOwnerRelation(targetField)) {
				errors.add(`${relationDescription} not an owner relation`)
				return undefined
			}
			if (!targetField.inversedBy) {
				errors.add(`${relationDescription} inversed relation is not set`)
				return undefined
			}
			if (targetField.inversedBy !== field.name) {
				errors.add(
					`${relationDescription} back reference ${entityName}::${field.name} exepcted, ${targetField.target}::${targetField.inversedBy} given`,
				)
				return undefined
			}
			if (field.type === Model.RelationType.OneHasOne && targetField.type !== Model.RelationType.OneHasOne) {
				errors.add(`${relationDescription} "OneHasOne" type expected, "${targetField.type}" given`)
				return undefined
			}
			if (field.type === Model.RelationType.OneHasMany && targetField.type !== Model.RelationType.ManyHasOne) {
				errors.add(`${relationDescription} "ManyHasOne" type expected, "${targetField.type}" given`)
				return undefined
			}
			if (field.type === Model.RelationType.ManyHasMany && targetField.type !== Model.RelationType.ManyHasMany) {
				errors.add(`${relationDescription} "ManyHasMany" type expected, "${targetField.type}" given`)
				return undefined
			}
		} else {
			const inversedBy = field.inversedBy as string // todo
			if (inversedBy) {
				const targetField = targetEntity.fields[inversedBy]
				const relationDescription = `Target relation ${targetEntityName}::${inversedBy}:`
				if (!targetField) {
					errors.add(`${relationDescription} not exists`)
					return undefined
				}
				if (!isRelation(targetField)) {
					errors.add(`${relationDescription} not a relation`)
					return undefined
				}
				if (targetField.target !== entityName) {
					errors.add(
						`${relationDescription} back reference to entity ${entityName} expected, but ${targetField.target} given`,
					)
					return undefined
				}
				if (!isInversedRelation(targetField)) {
					errors.add(`${relationDescription} not an inversed relation`)
					return undefined
				}
				if (!targetField.ownedBy) {
					errors.add(`${relationDescription} owning relation is not set`)
					return undefined
				}
				if (targetField.ownedBy !== field.name) {
					errors.add(
						`${relationDescription} back reference ${entityName}::${field.name} exepcted, ${targetField.target}::${targetField.ownedBy} given`,
					)
					return undefined
				}
				if (field.type === Model.RelationType.OneHasOne && targetField.type !== Model.RelationType.OneHasOne) {
					errors.add(`${relationDescription} "OneHasOne" type expected, "${targetField.type}" given`)
					return undefined
				}
				if (field.type === Model.RelationType.ManyHasOne && targetField.type !== Model.RelationType.OneHasMany) {
					errors.add(`${relationDescription} "ManyHasOne" type expected, "${targetField.type}" given`)
					return undefined
				}
				if (field.type === Model.RelationType.ManyHasMany && targetField.type !== Model.RelationType.ManyHasMany) {
					errors.add(`${relationDescription} "ManyHasMany" type expected, "${targetField.type}" given`)
					return undefined
				}
			}
		}
		return (field as any) as Model.AnyRelation // todo
	}
}

const isRelation = (field: Model.AnyField): field is Model.AnyRelation =>
	Object.values(Model.RelationType).includes(field.type as Model.RelationType)
