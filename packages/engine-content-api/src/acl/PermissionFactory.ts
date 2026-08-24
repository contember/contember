import { Acl, Model, Schema, Writable } from '@contember/schema'
import { getEntity, PredicateDefinitionProcessor, splitEntityPermissions } from '@contember/schema-utils'
import { mapObject } from '../utils/index.js'
import { prefixVariable } from './VariableUtils.js'

export interface Identity {
	projectRoles: readonly string[]
}

export interface ContextualPermissions {
	root: Acl.Permissions
	all: Acl.Permissions
}

/**
 * `root` covers what a role may do as the query or mutation root; `all` adds the grants that apply
 * only when the entity is reached through a relation.
 */
export type PermissionScope = 'root' | 'all'

export class PermissionFactory {
	public create(schema: Schema, roles: readonly string[], prefix?: string, scope: PermissionScope = 'root'): Acl.Permissions {
		return this.createInternal(schema, roles, scope, prefix)
	}

	public createContextual(schema: Schema, roles: readonly string[]): ContextualPermissions {
		return {
			root: this.createInternal(schema, roles, 'root'),
			all: this.createInternal(schema, roles, 'all'),
		}
	}

	private createInternal(schema: Schema, roles: readonly string[], scope: PermissionScope, prefix?: string): Acl.Permissions {
		let result: Acl.Permissions = {}
		for (let role of roles) {
			const roleDefinition = schema.acl.roles[role] || { entities: {} }
			let rolePermissions: Acl.Permissions = this.projectScope(
				this.prefixPredicatesWithRole(schema.model, roleDefinition.entities, prefix || role),
				scope,
			)
			if (roleDefinition.inherits) {
				const inheritedPermissions = this.createInternal(schema, roleDefinition.inherits, scope, prefix || role)
				rolePermissions = this.mergePermissions(inheritedPermissions, rolePermissions)
			}
			result = this.mergePermissions(result, rolePermissions)
		}
		result = this.makePrimaryPredicatesUnionOfAllFields(schema.model, result)

		return result
	}

	/**
	 * Flattens each entity to the grants effective in the requested scope, so everything downstream
	 * merges plain permission sets and never has to reason about `through` again. The projection runs
	 * per role, before any merging - which is what keeps a single role's root set free of its own
	 * through-only grants.
	 */
	private projectScope(permissions: Acl.Permissions, scope: PermissionScope): Acl.Permissions {
		return mapObject(permissions, (entityPermissions): Acl.EntityPermissions => {
			const { root, through } = splitEntityPermissions(entityPermissions)
			if (scope === 'root' || Object.keys(through.operations).length === 0) {
				return root
			}
			return this.mergeEntityPermissions(root, through)
		})
	}

	private prefixPredicatesWithRole(model: Model.Schema, permissions: Acl.Permissions, role: string): Acl.Permissions {
		return mapObject(permissions, ({ operations, predicates }, entityName) => ({
			operations,
			predicates: mapObject(predicates, predicate => {
				const predicateDefinitionProcessor = new PredicateDefinitionProcessor(model)
				return predicateDefinitionProcessor.process(getEntity(model, entityName), predicate, {
					handleColumn: ({ value }) => {
						if (typeof value === 'string') {
							return prefixVariable(role, value)
						}
						return value
					},
					handleRelation: ({ value }) => {
						if (typeof value === 'string') {
							return prefixVariable(role, value)
						}
						return value
					},
				})
			}),
		}))
	}

	private makePrimaryPredicatesUnionOfAllFields(model: Model.Schema, permissions: Acl.Permissions): Acl.Permissions {
		return mapObject(permissions, (permission, entityName): Acl.EntityPermissions => {
			const entity = getEntity(model, entityName)
			const entityPredicates: Writable<Acl.PredicateMap> = { ...permission.predicates }
			const entityOperations: Writable<Acl.EntityOperations> = { ...permission.operations }

			const operationNames = ['read', 'create', 'update'] as const
			for (let operation of operationNames) {
				if (!entityOperations[operation]) {
					continue
				}
				const fieldPermissions: Writable<Acl.FieldPermissions> = { ...entityOperations[operation] }
				entityOperations[operation] = fieldPermissions

				if (Object.values(fieldPermissions).some(it => it === true)) {
					fieldPermissions[entity.primary] = true
				}
				if (fieldPermissions[entity.primary] === true) {
					continue
				}
				const predicateReferences: string[] = Object.entries(fieldPermissions)
					.filter(([key]) => key !== entity.primary)
					.map(([key, value]) => value)
					.filter(value => value !== false)
					.filter((value, index, array): value is string => array.indexOf(value) === index)

				let idPermissions: Acl.Predicate = fieldPermissions[entity.primary] || false

				for (let predicateReference of predicateReferences) {
					const { predicateDefinition, predicate } = this.mergePredicates(
						entityPredicates,
						idPermissions,
						entityPredicates,
						predicateReference,
					)
					if (typeof predicate !== 'string' || predicateDefinition === undefined) {
						throw new Error('should not happen')
					}
					idPermissions = predicate
					entityPredicates[predicate] = predicateDefinition
				}
				fieldPermissions[entity.primary] = idPermissions
				entityPredicates[idPermissions as Acl.PredicateReference] = entityPredicates[idPermissions as Acl.PredicateReference]
			}
			return {
				operations: entityOperations,
				predicates: entityPredicates,
			}
		})
	}

	private mergePermissions(left: Acl.Permissions, right: Acl.Permissions): Acl.Permissions {
		const result = { ...left }
		for (let entityName in right) {
			if (result[entityName] !== undefined) {
				result[entityName] = this.mergeEntityPermissions(result[entityName], right[entityName])
			} else {
				result[entityName] = right[entityName]
			}
		}
		return result
	}

	/**
	 * Both sides are already scope-projected, so this is a plain union of grants - `through` and the
	 * legacy `noRoot` never reach here.
	 */
	private mergeEntityPermissions(left: Acl.EntityPermissions, right: Acl.EntityPermissions): Acl.EntityPermissions {
		let predicates: Writable<Acl.PredicateMap> = {}
		const operations: Writable<Acl.EntityOperations> = {}
		// Three-state: unstated stays unstated so the role-level default still applies, an explicit `false` survives, and `true` wins across roles.
		if (left.operations.customPrimary !== undefined || right.operations.customPrimary !== undefined) {
			operations.customPrimary = (left.operations.customPrimary ?? false) || (right.operations.customPrimary ?? false)
		}
		if (left.operations.refreshMaterializedView !== undefined || right.operations.refreshMaterializedView !== undefined) {
			operations.refreshMaterializedView = (left.operations.refreshMaterializedView ?? false) || (right.operations.refreshMaterializedView ?? false)
		}

		for (
			let operation of [
				'create',
				'read',
				'update',
			] as const
		) {
			const { predicates: opPredicates, permissions: fieldPermissions } = this.mergeFieldPermissions(
				left.predicates,
				left.operations[operation],
				right.predicates,
				right.operations[operation],
			)

			predicates = { ...predicates, ...opPredicates }
			if (Object.keys(fieldPermissions).length > 0) {
				operations[operation] = fieldPermissions
			}
		}

		const { predicateDefinition, predicate } = this.mergePredicates(
			left.predicates,
			left.operations.delete,
			right.predicates,
			right.operations.delete,
		)
		if (predicate === true) {
			operations.delete = true
		} else if (predicateDefinition !== undefined && typeof predicate === 'string') {
			predicates[predicate] = predicateDefinition
			operations.delete = predicate
		}

		return {
			predicates: predicates,
			operations: operations,
		}
	}

	private mergeFieldPermissions(
		leftPredicates: Acl.PredicateMap,
		leftFieldPermissions: Acl.FieldPermissions | undefined = {},
		rightPredicates: Acl.PredicateMap,
		rightFieldPermissions: Acl.FieldPermissions | undefined = {},
	): { predicates: Acl.PredicateMap; permissions: Acl.FieldPermissions } {
		const permissions: Writable<Acl.FieldPermissions> = {}
		const predicates: Writable<Acl.PredicateMap> = {}

		for (let field in { ...leftFieldPermissions, ...rightFieldPermissions }) {
			const { predicateDefinition, predicate } = this.mergePredicates(
				leftPredicates,
				leftFieldPermissions[field] || false,
				rightPredicates,
				rightFieldPermissions[field] || false,
			)
			if (predicate === true) {
				permissions[field] = true
			} else if (predicateDefinition !== undefined && typeof predicate === 'string') {
				permissions[field] = predicate
				predicates[predicate] = predicateDefinition
			}
		}

		return { predicates, permissions }
	}

	private mergePredicates(
		leftPredicates: Acl.PredicateMap,
		leftReference: Acl.Predicate | undefined = false,
		rightPredicates: Acl.PredicateMap,
		rightReference: Acl.Predicate | undefined = false,
	): {
		predicate: Acl.PredicateReference | boolean
		predicateDefinition: Acl.PredicateDefinition | undefined
	} {
		if (leftReference === true || rightReference === true) {
			return {
				predicate: true,
				predicateDefinition: undefined,
			}
		}

		if (leftReference !== false && rightReference !== false) {
			const leftPredicate: Acl.PredicateDefinition = leftPredicates[leftReference]
			const rightPredicate: Acl.PredicateDefinition = rightPredicates[rightReference]
			if (leftPredicate === rightPredicate) {
				return {
					predicate: leftReference,
					predicateDefinition: leftPredicate,
				}
			}

			let predicateName = '__merge__' + leftReference + '__' + rightReference
			while (leftPredicates[predicateName]) {
				predicateName += '_'
			}
			return {
				predicate: predicateName,
				predicateDefinition: {
					or: [leftPredicate, rightPredicate],
				} as Acl.PredicateDefinition,
			}
		} else if (leftReference !== false) {
			return {
				predicate: leftReference,
				predicateDefinition: leftPredicates[leftReference],
			}
		} else if (rightReference !== false) {
			let predicateName = rightReference
			if (rightPredicates !== leftPredicates) {
				while (leftPredicates[predicateName]) {
					predicateName += '_'
				}
			}
			return {
				predicate: predicateName,
				predicateDefinition: rightPredicates[rightReference],
			}
		} else {
			return {
				predicate: false,
				predicateDefinition: undefined,
			}
		}
	}
}
