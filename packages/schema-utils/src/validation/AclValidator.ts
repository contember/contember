import { Acl, Model } from '@contember/schema'
import { PredicateDefinitionProcessor } from '../acl/index.js'
import { getEntity } from '../model/index.js'
import { ErrorBuilder, ValidationError } from './errors.js'
import { conditionSchema } from '../type-schema/index.js'

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
				errorBuilder.for(inheritsFrom).add('ACL_UNDEFINED_ROLE', 'Referenced role not exists.')
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
					errorBuilder.add('ACL_UNDEFINED_ENTITY', `Entity "${variable.entityName}" not found`)
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
				errorBuilder.add('ACL_UNDEFINED_ENTITY', `Entity ${entityName} not found`)
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
		this.validateStateMarkers(predicate, errorBuilder, false, false)

		const processor = new PredicateDefinitionProcessor(this.model)
		processor.process(entity, predicate, {
			handleColumn: ctx => {
				if (typeof ctx.value === 'string') {
					if (!variables[ctx.value]) {
						errorBuilder.for(...ctx.path).add('ACL_UNDEFINED_VARIABLE', `Undefined variable ${ctx.value}`)
					}
				} else {
					try {
						conditionSchema(ctx.column.type)(ctx.value)
					} catch (e: any) {
						errorBuilder.for(...ctx.path).add('ACL_INVALID_CONDITION', `Invalid condition (${e.message}): ${JSON.stringify(ctx.value)}`)
					}
				}
				return ctx.value
			},
			handleRelation: ctx => {
				if (typeof ctx.value === 'string' && !variables[ctx.value]) {
					errorBuilder.for(...ctx.path).add('ACL_UNDEFINED_VARIABLE', `Undefined variable ${ctx.value}`)
				}
				return ctx.value
			},
			handleUndefinedField: ctx => {
				errorBuilder.for(...ctx.path).add('ACL_UNDEFINED_FIELD', `Undefined field ${ctx.name} on entity ${ctx.entity.name}`)
				return ctx.value
			},
		})
	}

	/**
	 * The `_old`/`_new` update-state markers are only supported at the top level and inside `and`
	 * chains. Inside `or`/`not` their meaning would depend on the evaluated state and is rejected.
	 * Nesting a marker inside another marker is likewise meaningless.
	 */
	private validateStateMarkers(
		predicate: Acl.PredicateDefinition,
		errorBuilder: ErrorBuilder,
		insideBranching: boolean,
		insideMarker: boolean,
	): void {
		for (const [key, value] of Object.entries(predicate)) {
			if (value === undefined) {
				continue
			}
			if (key === Acl.PredicateOldStateMarker || key === Acl.PredicateNewStateMarker) {
				if (insideBranching) {
					errorBuilder.for(key).add(
						'ACL_INVALID_STATE_MARKER',
						`Update-state marker "${key}" cannot be used inside "or"/"not"; use it at the top level or within "and".`,
					)
				}
				if (insideMarker) {
					errorBuilder.for(key).add(
						'ACL_INVALID_STATE_MARKER',
						`Update-state marker "${key}" cannot be nested inside another "_old"/"_new" marker.`,
					)
				}
				this.validateStateMarkers(value as Acl.PredicateDefinition, errorBuilder.for(key), insideBranching, true)
			} else if (key === 'and') {
				;(value as Acl.PredicateDefinition[]).forEach(it => this.validateStateMarkers(it, errorBuilder.for(key), insideBranching, insideMarker))
			} else if (key === 'or') {
				;(value as Acl.PredicateDefinition[]).forEach(it => this.validateStateMarkers(it, errorBuilder.for(key), true, insideMarker))
			} else if (key === 'not') {
				this.validateStateMarkers(value as Acl.PredicateDefinition, errorBuilder.for(key), true, insideMarker)
			}
		}
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
				errorBuilder.add('ACL_UNDEFINED_FIELD', `Field ${field} not found on entity ${entity.name}`)
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
			errorBuilder.add('ACL_UNDEFINED_PREDICATE', `Predicate ${predicate} not found`)
		}
	}
}
