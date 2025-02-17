import { Acl, Model, Schema, Writable } from '@contember/schema'
import { getEntity, PredicateDefinitionProcessor } from '@contember/schema-utils'
import { mapObject } from '../utils'
import { prefixVariable } from './VariableUtils'

export interface Identity {
	projectRoles: readonly string[]
}

export class PermissionFactory {
	public create(schema: Schema, roles: readonly string[], prefix?: string): Acl.Permissions {
		let result: Acl.Permissions = {}
		for (let role of roles) {
			const roleDefinition = schema.acl.roles[role] || { entities: {} }
			let rolePermissions: Acl.Permissions = this.prefixPredicatesWithRole(schema.model, roleDefinition.entities, prefix || role)
			if (roleDefinition.inherits) {
				const inheritedPermissions = this.create(schema, roleDefinition.inherits, prefix || role)
				rolePermissions = this.mergePermissions(inheritedPermissions, rolePermissions)
			}
			result = this.mergePermissions(result, rolePermissions)
		}
		result = this.makePrimaryPredicatesUnionOfAllFields(schema.model, result)

		return result
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

	private mergeEntityPermissions(left: Acl.EntityPermissions, right: Acl.EntityPermissions): Acl.EntityPermissions {
		let predicates: Writable<Acl.PredicateMap> = {}
		const operations: Writable<Acl.EntityOperations> = {}
		if (left.operations.customPrimary || right.operations.customPrimary) {
			operations.customPrimary = true
		}
		const noRoot: `${Acl.Operation}`[] = []

		for (let operation of [
			'create',
			'read',
			'update',
		] as const) {

			const { predicates: opPredicates, permissions: fieldPermissions, noRoot: opNoRoot } = this.mergeOperationPermissions(left, right, operation)

			if (opNoRoot) {
				noRoot.push(operation)
			}

			predicates = { ...predicates, ...opPredicates }
			if (Object.keys(fieldPermissions).length > 0) {
				operations[operation] = fieldPermissions
			}
		}

		const { predicateDefinition, predicate, noRoot: opNoRoot } = this.mergeDeletePermissions(left, right)
		if (opNoRoot) {
			noRoot.push('delete')
		}
		if (predicate === true) {
			operations.delete = true
		} else if (predicateDefinition !== undefined && typeof predicate === 'string') {
			predicates[predicate] = predicateDefinition
			operations.delete = predicate
		}


		if (noRoot.length > 0) {
			operations.noRoot = noRoot
		}

		return {
			predicates: predicates,
			operations: operations,
		}
	}


	private mergeOperationPermissions(left: Acl.EntityPermissions, right: Acl.EntityPermissions, operation: 'create' | 'read' | 'update'): {
		noRoot: boolean
		predicates: Acl.PredicateMap
		permissions: Acl.FieldPermissions
	} {
		const { noRoot, leftPermissions, rightPermissions } = this.resolveNoRoot(left, right, operation)
		return {
			noRoot,
			...this.mergeFieldPermissions(
				left.predicates,
				leftPermissions,
				right.predicates,
				rightPermissions,
			),
		}
	}

	private mergeDeletePermissions(left: Acl.EntityPermissions, right: Acl.EntityPermissions): {
		noRoot: boolean
		predicate: Acl.PredicateReference | boolean
		predicateDefinition: Acl.PredicateDefinition | undefined
	} {
		const { noRoot, leftPermissions, rightPermissions } = this.resolveNoRoot(left, right, 'delete')

		return {
			noRoot,
			...this.mergePredicates(
				left.predicates,
				leftPermissions,
				right.predicates,
				rightPermissions,
			),
		}
	}

	private resolveNoRoot<const Op extends`${Acl.Operation}`>(left: Acl.EntityPermissions, right: Acl.EntityPermissions, operation: Op): {
		noRoot: boolean
		leftPermissions: Acl.EntityPermissions['operations'][Op] | undefined
		rightPermissions: Acl.EntityPermissions['operations'][Op] | undefined
	} {
		const leftRootForbidden = left.operations.noRoot?.includes(operation) || false
		const rightRootForbidden = right.operations.noRoot?.includes(operation) || false
		const leftPermissions = left.operations[operation]
		const rightPermissions = right.operations[operation]

		const rootForbidden = (leftRootForbidden && rightRootForbidden)
			|| (leftRootForbidden && !rightPermissions)
			|| (rightRootForbidden && !leftPermissions)

		const resolvedLeftPermissions = !rootForbidden && leftRootForbidden ? undefined : leftPermissions
		const resolvedRightPermissions = !rootForbidden && rightRootForbidden ? undefined : rightPermissions

		return {
			noRoot: rootForbidden,
			leftPermissions: resolvedLeftPermissions,
			rightPermissions: resolvedRightPermissions,
		}
	}

	private mergeFieldPermissions(
		leftPredicates: Acl.PredicateMap,
		leftFieldPermissions: Acl.FieldPermissions | undefined = {},
		rightPredicates: Acl.PredicateMap,
		rightFieldPermissions: Acl.FieldPermissions | undefined = {},
	): {predicates: Acl.PredicateMap; permissions: Acl.FieldPermissions} {
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
