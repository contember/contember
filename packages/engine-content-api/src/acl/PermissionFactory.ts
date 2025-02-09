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
					const [predicateDefinition, predicate] = this.mergePredicates(
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

		const operationNames: (keyof Pick<Acl.EntityOperations, 'create' | 'read' | 'update'>)[] = [
			'create',
			'read',
			'update',
		]

		for (let operation of operationNames) {
			const leftNoRoot = left.operations.noRoot?.includes(operation) || false
			const rightNoRoot = right.operations.noRoot?.includes(operation) || false
			if (leftNoRoot && rightNoRoot) {
				noRoot.push(operation)
			}

			const leftFieldPermissions: Acl.FieldPermissions = leftNoRoot && !rightNoRoot ? {} : (left.operations[operation] || {})
			const rightFieldPermissions: Acl.FieldPermissions = rightNoRoot && !leftNoRoot ? {} : (right.operations[operation] || {})
			const [operationPredicates, fieldPermissions] = this.mergeFieldPermissions(
				left.predicates,
				leftFieldPermissions,
				right.predicates,
				rightFieldPermissions,
			)
			predicates = { ...predicates, ...operationPredicates }
			if (Object.keys(fieldPermissions).length > 0) {
				operations[operation] = fieldPermissions
			}
		}

		const [predicateDefinition, predicate] = this.mergePredicates(
			left.predicates,
			left.operations.delete || false,
			right.predicates,
			right.operations.delete || false,
		)
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

	private mergeFieldPermissions(
		leftPredicates: Acl.PredicateMap,
		leftFieldPermissions: Acl.FieldPermissions,
		rightPredicates: Acl.PredicateMap,
		rightFieldPermissions: Acl.FieldPermissions,
	): [Acl.PredicateMap, Acl.FieldPermissions] {
		const fields: Writable<Acl.FieldPermissions> = {}
		const predicates: Writable<Acl.PredicateMap> = {}

		for (let field in { ...leftFieldPermissions, ...rightFieldPermissions }) {
			const [predicateDefinition, predicate] = this.mergePredicates(
				leftPredicates,
				leftFieldPermissions[field] || false,
				rightPredicates,
				rightFieldPermissions[field] || false,
			)
			if (predicate === true) {
				fields[field] = true
			} else if (predicateDefinition !== undefined && typeof predicate === 'string') {
				fields[field] = predicate
				predicates[predicate] = predicateDefinition
			}
		}

		return [predicates, fields]
	}

	private mergePredicates(
		leftPredicates: Acl.PredicateMap,
		leftReference: Acl.Predicate,
		rightPredicates: Acl.PredicateMap,
		rightReference: Acl.Predicate,
	): [Acl.PredicateDefinition, Acl.PredicateReference] | [undefined, boolean] {
		if (leftReference === true || rightReference === true) {
			return [undefined, true]
		}

		if (leftReference !== false && rightReference !== false) {
			const leftPredicate: Acl.PredicateDefinition = leftPredicates[leftReference]
			const rightPredicate: Acl.PredicateDefinition = rightPredicates[rightReference]
			if (leftPredicate === rightPredicate) {
				return [leftPredicate, leftReference]
			}

			let predicateName = '__merge__' + leftReference + '__' + rightReference
			while (leftPredicates[predicateName]) {
				predicateName += '_'
			}
			return [
				{
					or: [leftPredicate, rightPredicate],
				} as Acl.PredicateDefinition,
				predicateName,
			]
		} else if (leftReference !== false) {
			return [leftPredicates[leftReference], leftReference]
		} else if (rightReference !== false) {
			let predicateName = rightReference
			if (rightPredicates !== leftPredicates) {
				while (leftPredicates[predicateName]) {
					predicateName += '_'
				}
			}
			return [rightPredicates[rightReference], predicateName]
		} else {
			return [undefined, false]
		}
	}
}
