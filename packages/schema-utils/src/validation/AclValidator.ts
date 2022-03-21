import { Acl, Model } from '@contember/schema'
import { PredicateDefinitionProcessor } from '../acl'
import { getEntity } from '../model'
import { ErrorBuilder, ValidationError } from './errors'


export class AclValidator {
	constructor(private readonly model: Model.Schema) {}

	public validate(schema: Acl.Schema): ValidationError[] {
		const errorBuilder = new ErrorBuilder([], ['acl'])
		this.validateRoles(schema.roles, errorBuilder)
		return errorBuilder.errors
	}

	private validateRoles(roles: Acl.Roles, errorBuilder: ErrorBuilder): void {
		for (const role in roles) {
			if (!roles.hasOwnProperty(role)) {
				continue
			}
			this.validateRolePermissions(roles[role], Object.keys(roles), errorBuilder.for(role))
		}
	}

	private validateRolePermissions(
		permissions: Acl.RolePermissions,
		roles: string[],
		errorBuilder: ErrorBuilder,
	): void {

		this.validateInherits(permissions.inherits, roles, errorBuilder.for('inherits'))
		this.validateVariables(permissions.variables, errorBuilder.for('variables'))
		this.validatePermissions(permissions.entities, (permissions.variables as Acl.Variables) || {}, errorBuilder.for('entities'))
		// todo: plugins validation
	}

	private validateInherits(inherits: Acl.RolePermissions['inherits'], roles: string[], errorBuilder: ErrorBuilder): void {
		if (inherits === undefined) {
			return undefined
		}
		for (const inheritsFrom of inherits) {
			if (!roles.includes(inheritsFrom)) {
				errorBuilder.for(inheritsFrom).add('Referenced role not exists.')
			}
		}
	}

	private validateVariables(variables: Acl.Variables, errorBuilder: ErrorBuilder): void {
		for (const varName in variables) {
			if (!variables.hasOwnProperty(varName)) {
				continue
			}
			this.validateVariable(variables[varName], errorBuilder.for(varName))
		}
	}

	private validateVariable(variable: Acl.Variable, errorBuilder: ErrorBuilder): void {
		switch (variable.type) {
			case 'entity':
				if (!this.model.entities[variable.entityName]) {
					errorBuilder.add(`Entity "${variable.entityName}" not found`)
					return
				}
		}
		return
	}

	private validatePermissions(permissions: Acl.Permissions, variables: Acl.Variables, errorBuilder: ErrorBuilder): void {
		for (const entityName in permissions) {
			if (!permissions.hasOwnProperty(entityName)) {
				continue
			}
			if (!this.model.entities[entityName]) {
				errorBuilder.add(`Entity ${entityName} not found`)
				continue
			}
			const entity = getEntity(this.model, entityName)

			this.validateEntityPermissions(
				permissions[entityName],
				entity,
				variables,
				errorBuilder.for(entityName),
			)
		}
	}

	private validateEntityPermissions(
		entityPermissions: Acl.EntityPermissions,
		entity: Model.Entity,
		variables: Acl.Variables,
		errorBuilder: ErrorBuilder,
	): void {
		this.validatePredicates(
			entityPermissions.predicates,
			entity,
			variables,
			errorBuilder.for('predicates'),
		)
		this.validateOperations(
			entityPermissions.operations,
			entity,
			entityPermissions.predicates as Acl.PredicateMap,
			errorBuilder.for('operations'),
		)
	}

	private validatePredicates(predicates: Acl.PredicateMap, entity: Model.Entity, variables: Acl.Variables, errorBuilder: ErrorBuilder): void {
		for (const predicateName in predicates) {
			if (!predicates.hasOwnProperty(predicateName)) {
				continue
			}
			this.validatePredicateDefinition(
				predicates[predicateName],
				entity,
				variables,
				errorBuilder.for(predicateName),
			)
		}
	}

	private validatePredicateDefinition(
		predicate: Acl.PredicateDefinition,
		entity: Model.Entity,
		variables: Acl.Variables,
		errorBuilder: ErrorBuilder,
	): void {
		const processor = new PredicateDefinitionProcessor(this.model)
		processor.process(entity, predicate, {
			handleColumn: ctx => {
				if (typeof ctx.value === 'string' && !variables[ctx.value]) {
					errorBuilder.for(...ctx.path).add(`Undefined variable ${ctx.value}`)
				}
				return ctx.value
			},
			handleRelation: ctx => {
				if (typeof ctx.value === 'string' && !variables[ctx.value]) {
					errorBuilder.for(...ctx.path).add(`Undefined variable ${ctx.value}`)
				}
				return ctx.value
			},
			handleUndefinedField: ctx => {
				errorBuilder.for(...ctx.path).add(`Undefined field ${ctx.name} on entity ${ctx.entity.name}`)
				return ctx.value
			},
		})
	}

	private validateOperations(
		operations: Acl.EntityOperations,
		entity: Model.Entity,
		predicates: Acl.PredicateDefinition,
		errorBuilder: ErrorBuilder,
	): void {
		if (operations.delete !== undefined) {
			this.validatePredicate(operations.delete, predicates, errorBuilder.for('delete'))
		}
		for (const op of ['read', 'create', 'update'] as const) {
			const operation = operations[op]
			if (operation !== undefined) {
				this.validateFieldPermissions(operation, entity, predicates, errorBuilder.for(op))
			}
		}
	}

	private validateFieldPermissions(
		permissions: Acl.FieldPermissions,
		entity: Model.Entity,
		predicates: Acl.PredicateDefinition,
		errorBuilder: ErrorBuilder,
	): void {
		for (const field in permissions) {
			if (!permissions.hasOwnProperty(field)) {
				continue
			}
			if (!entity.fields[field]) {
				errorBuilder.add(`Field ${field} not found on entity ${entity.name}`)
			}
			this.validatePredicate(permissions[field], predicates, errorBuilder.for(field))
		}
	}

	private validatePredicate(
		predicate: Acl.Predicate,
		predicates: Acl.PredicateDefinition,
		errorBuilder: ErrorBuilder,
	): void {
		if (predicate === false || predicate === true) {
			return
		}
		if (!predicates[predicate]) {
			errorBuilder.add(`Predicate ${predicate} not found`)
		}
	}
}
