import { Acl, Model } from '@contember/schema'
import { checkExtraProperties, everyIs, hasStringProperty, isObject } from './utils'
import { PredicateDefinitionProcessor } from '../acl'
import { getEntity } from '../model'
import { ErrorBuilder, ValidationError } from './errors'

export class AclValidator {
	constructor(private readonly model: Model.Schema) {}

	public validate(schema: unknown): [Acl.Schema, ValidationError[]] {
		const errorBuilder = new ErrorBuilder([], ['acl'])
		let validSchema: Acl.Schema
		if (!isObject(schema)) {
			errorBuilder.add('Must be an object')
			validSchema = { roles: {} }
		} else if (!schema.roles) {
			errorBuilder.for('roles').add('Property is missing')
			validSchema = { roles: {} }
		} else {
			validSchema = { roles: this.validateRoles(schema.roles, errorBuilder) }
		}
		return [validSchema, errorBuilder.errors]
	}

	private validateRoles(roles: unknown, errorBuilder: ErrorBuilder): Acl.Schema['roles'] {
		if (!isObject(roles)) {
			errorBuilder.add('Must be an object')
			return {}
		}
		const validRoles: Acl.Schema['roles'] = {}
		for (const role in roles) {
			if (!roles.hasOwnProperty(role)) {
				continue
			}
			// if (role === 'admin') {
			// 	errorBuilder.add('Role "admin" is reserved.')
			// 	continue
			// }
			const rolePermissions = this.validateRolePermissions(roles[role], Object.keys(roles), errorBuilder.for(role))
			if (rolePermissions !== undefined) {
				validRoles[role] = rolePermissions
			}
		}
		return validRoles
	}

	private validateRolePermissions(
		permissions: unknown,
		roles: string[],
		errorBuilder: ErrorBuilder,
	): Acl.RolePermissions | undefined {
		if (!isObject(permissions)) {
			errorBuilder.add('Must be an object')
			return
		}

		const {
			inherits: inheritsIn,
			variables: variablesIn,
			stages: stagesIn,
			entities: entitiesIn,
			implicit: implicitIn,
			...plugins
		} = permissions

		const inherits = this.validateInherits(inheritsIn, roles, errorBuilder.for('inherits'))
		const variables = this.validateVariables(variablesIn, errorBuilder.for('variables'))
		const stages = this.validateStagesDefinition(stagesIn, errorBuilder.for('stages'))
		const entities = this.validatePermissions(
			entitiesIn,
			(permissions.variables as Acl.Variables) || {},
			errorBuilder.for('entities'),
		)
		// todo: plugins validation

		const result: Acl.RolePermissions = { variables, stages, entities }
		if (inherits !== undefined) {
			result.inherits = inherits
		}
		if (implicitIn !== undefined) {
			if (typeof implicitIn !== 'boolean') {
				errorBuilder.for('implicit').add('Must be boolean')
				return
			}
			result.implicit = implicitIn
		}

		return { ...plugins, ...result }
	}

	private validateInherits(inherits: unknown, roles: string[], errorBuilder: ErrorBuilder): string[] | undefined {
		if (inherits === undefined) {
			return undefined
		}
		if (!Array.isArray(inherits) || !everyIs(inherits, (it): it is string => typeof it === 'string')) {
			errorBuilder.add('Must be an array of strings')
			return []
		} else {
			const validRoles: string[] = []
			for (const inheritsFrom of inherits) {
				if (!roles.includes(inheritsFrom)) {
					// todo: check recursion
					errorBuilder.for(inheritsFrom).add('Referenced role not exists.')
				} else {
					validRoles.push(inheritsFrom)
				}
			}
			return validRoles
		}
	}

	private validateVariables(variables: unknown, errorBuilder: ErrorBuilder): Acl.Variables {
		let validVariables: Acl.Variables = {}
		if (!isObject(variables)) {
			errorBuilder.add('Must be an object')
			return {}
		}
		for (const varName in variables) {
			if (!variables.hasOwnProperty(varName)) {
				continue
			}
			const validVariable = this.validateVariable(variables[varName], errorBuilder.for(varName))
			if (validVariable) {
				validVariables[varName] = validVariable
			}
		}
		return validVariables
	}

	private validateVariable(variable: unknown, errorBuilder: ErrorBuilder): Acl.Variable | undefined {
		if (!isObject(variable)) {
			errorBuilder.add('Must be an object')
			return
		}
		if (!hasStringProperty(variable, 'type')) {
			errorBuilder.add('Variable type is not defined')
			return
		}
		switch (variable.type) {
			case Acl.VariableType.entity:
				if (!hasStringProperty(variable, 'entityName')) {
					errorBuilder.add('Entity name must be specified for this type of variable')
					return
				}
				if (!this.model.entities[variable.entityName]) {
					errorBuilder.add(`Entity "${variable.entityName}" not found`)
					return
				}
				const extra = checkExtraProperties(variable, ['entityName', 'type'])
				if (extra.length) {
					errorBuilder.add('Unsupported properties found: ' + extra.join(', '))
				}
				return { type: Acl.VariableType.entity, entityName: variable.entityName }

			case Acl.VariableType.predefined:
				if (!hasStringProperty(variable, 'value')) {
					errorBuilder.add('Variable value type must be specified for this type of variable')
					return
				}
				if (variable.value !== 'identityID' && variable.value !== 'personID') {
					errorBuilder.add('Unknown predefined variable')
					return
				}
				const extra2 = checkExtraProperties(variable, ['type', 'value'])
				if (extra2.length) {
					errorBuilder.add('Unsupported properties found: ' + extra2.join(', '))
				}
				return { type: variable.type, value: variable.value }
			default:
				errorBuilder.add(`Variable type "${variable.type}" is not supported.`)
		}
		return
	}

	private validateStagesDefinition(stages: unknown, errorBuilder: ErrorBuilder): Acl.StagesDefinition {
		if (stages === '*') {
			return '*'
		}
		if (!Array.isArray(stages) || !everyIs(stages, (it): it is string => typeof it === 'string')) {
			errorBuilder.add('Stages must be either "*" or array of stage names')
			return []
		}
		// todo validate stages ??
		return stages
	}

	private validatePermissions(
		permissions: unknown,
		variables: Acl.Variables,
		errorBuilder: ErrorBuilder,
	): Acl.Permissions {
		if (!isObject(permissions)) {
			errorBuilder.add('Must be an object')
			return {}
		}
		const validPermissions: Acl.Permissions = {}
		for (const entityName in permissions) {
			if (!permissions.hasOwnProperty(entityName)) {
				continue
			}
			if (!this.model.entities[entityName]) {
				errorBuilder.add(`Entity ${entityName} not found`)
				continue
			}
			const entity = getEntity(this.model, entityName)

			const entityPermissions = this.validateEntityPermissions(
				permissions[entityName],
				entity,
				variables,
				errorBuilder.for(entityName),
			)
			if (entityPermissions) {
				validPermissions[entityName] = entityPermissions
			}
		}
		return validPermissions
	}

	private validateEntityPermissions(
		entityPermissions: unknown,
		entity: Model.Entity,
		variables: Acl.Variables,
		errorBuilder: ErrorBuilder,
	): Acl.EntityPermissions | undefined {
		if (!isObject(entityPermissions)) {
			errorBuilder.add('Must be an object')
			return
		}
		const extra = checkExtraProperties(entityPermissions, ['predicates', 'operations'])
		if (extra.length) {
			errorBuilder.add('Unsupported properties found: ' + extra.join(', '))
		}
		const predicates = this.validatePredicates(
			entityPermissions.predicates,
			entity,
			variables,
			errorBuilder.for('predicates'),
		)
		const operations = this.validateOperations(
			entityPermissions.operations,
			entity,
			entityPermissions.predicates as Acl.PredicateMap,
			errorBuilder.for('operations'),
		)

		return { operations, predicates }
	}

	private validatePredicates(
		predicates: unknown,
		entity: Model.Entity,
		variables: Acl.Variables,
		errorBuilder: ErrorBuilder,
	): Acl.PredicateMap {
		if (!isObject(predicates)) {
			errorBuilder.add('Must be an object')
			return {}
		}
		const validPredicates: Acl.PredicateMap = {}
		for (const predicateName in predicates) {
			if (!predicates.hasOwnProperty(predicateName)) {
				continue
			}
			const predicate = this.validatePredicateDefinition(
				predicates[predicateName],
				entity,
				variables,
				errorBuilder.for(predicateName),
			)
			if (predicate) {
				validPredicates[predicateName] = predicate
			}
		}
		return validPredicates
	}

	private validatePredicateDefinition(
		predicate: unknown,
		entity: Model.Entity,
		variables: Acl.Variables,
		errorBuilder: ErrorBuilder,
	): Acl.PredicateDefinition | undefined {
		if (!isObject(predicate)) {
			errorBuilder.add('Must be an object')
			return
		}
		const processor = new PredicateDefinitionProcessor(this.model)
		let valid = true
		const result = processor.process(entity, predicate, {
			handleColumn: ctx => {
				if (typeof ctx.value === 'string' && !variables[ctx.value]) {
					valid = false
					errorBuilder.for(...ctx.path).add(`Undefined variable ${ctx.value}`)
				}
				return ctx.value
			},
			handleRelation: ctx => {
				if (typeof ctx.value === 'string' && !variables[ctx.value]) {
					valid = false
					errorBuilder.for(...ctx.path).add(`Undefined variable ${ctx.value}`)
				}
				return ctx.value
			},
			handleUndefinedField: ctx => {
				errorBuilder.for(...ctx.path).add(`Undefined field ${ctx.name} on entity ${ctx.entity.name}`)
				valid = false
				return ctx.value
			},
		})
		if (!valid) {
			return
		}

		return result
	}

	private validateOperations(
		operations: unknown,
		entity: Model.Entity,
		predicates: Acl.PredicateDefinition,
		errorBuilder: ErrorBuilder,
	): Acl.EntityOperations {
		if (!isObject(operations)) {
			errorBuilder.add('Must be an object')
			return {}
		}
		const extra = checkExtraProperties(operations, ['read', 'create', 'update', 'delete', 'customPrimary'])
		if (extra.length) {
			errorBuilder.add('Unsupported properties found: ' + extra.join(', '))
		}
		const validOperations: Acl.EntityOperations = {}
		if (operations.delete !== undefined) {
			validOperations.delete = this.validatePredicate(operations.delete, predicates, errorBuilder.for('delete'))
		}
		for (const op of ['read', 'create', 'update'] as const) {
			if (operations[op]) {
				validOperations[op] = this.validateFieldPermissions(operations[op], entity, predicates, errorBuilder.for(op))
			}
		}
		if (operations.customPrimary !== undefined) {
			if (typeof operations.customPrimary !== 'boolean') {
				errorBuilder.for('customPrimary').add('Must be boolean')
			}
			validOperations.customPrimary = operations.customPrimary as boolean
		}

		return validOperations
	}

	private validateFieldPermissions(
		permissions: unknown,
		entity: Model.Entity,
		predicates: Acl.PredicateDefinition,
		errorBuilder: ErrorBuilder,
	): Acl.FieldPermissions {
		if (!isObject(permissions)) {
			errorBuilder.add('Must be an object')
			return {}
		}
		const valid: Acl.FieldPermissions = {}
		for (const field in permissions) {
			if (!permissions.hasOwnProperty(field)) {
				continue
			}
			if (!entity.fields[field]) {
				errorBuilder.add(`Field ${field} not found on entity ${entity.name}`)
			}
			valid[field] = this.validatePredicate(permissions[field], predicates, errorBuilder.for(field))
		}
		return valid
	}

	private validatePredicate(
		predicate: unknown,
		predicates: Acl.PredicateDefinition,
		errorBuilder: ErrorBuilder,
	): Acl.Predicate {
		if (predicate === false || predicate === true) {
			return predicate
		}
		if (typeof predicate !== 'string') {
			errorBuilder.add('Predicate must be either boolean or predicate reference')
			return false
		}
		if (!predicates[predicate]) {
			errorBuilder.add(`Predicate ${predicate} not found`)
			return false
		}
		return predicate
	}
}
