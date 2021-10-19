import { Acl, Model } from '@contember/schema'
import { getEntity, PredicateDefinitionProcessor } from '@contember/schema-utils'
import { mapObject } from '../utils'
import { prefixVariable } from './VariableUtils'

export class PermissionFactory {
	constructor(private readonly schema: Model.Schema) {}

	public create(acl: Acl.Schema, roles: string[], prefix?: string): Acl.Permissions {
		let result: Acl.Permissions = {}
		for (let role of roles) {
			const roleDefinition = acl.roles[role] || { entities: {} }
			let rolePermissions: Acl.Permissions = this.prefixPredicatesWithRole(roleDefinition.entities, prefix || role)
			if (roleDefinition.inherits) {
				const inheritedPermissions = this.create(acl, roleDefinition.inherits, prefix || role)
				rolePermissions = this.mergePermissions(inheritedPermissions, rolePermissions)
			}
			result = this.mergePermissions(result, rolePermissions)
		}
		this.makePrimaryPredicatesUnionOfAllFields(result)

		return result
	}

	private prefixPredicatesWithRole(permissions: Acl.Permissions, role: string): Acl.Permissions {
		return mapObject(permissions, ({ operations, predicates }, entityName) => ({
			operations,
			predicates: mapObject(predicates, predicate => {
				const predicateDefinitionProcessor = new PredicateDefinitionProcessor(this.schema)
				return predicateDefinitionProcessor.process(getEntity(this.schema, entityName), predicate, {
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

	private makePrimaryPredicatesUnionOfAllFields(permissions: Acl.Permissions): void {
		for (let entityName in permissions) {
			const entity = getEntity(this.schema, entityName)
			const entityPermissions: Acl.EntityPermissions = permissions[entityName]

			const operationNames = ['read', 'create', 'update'] as const
			for (let operation of operationNames) {
				const fieldPermissions: Acl.FieldPermissions | undefined = entityPermissions.operations[operation]
				if (fieldPermissions === undefined) {
					continue
				}
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
				const predicates = { ...entityPermissions.predicates }

				for (let predicateReference of predicateReferences) {
					const [predicateDefinition, predicate] = this.mergePredicates(
						predicates,
						idPermissions,
						predicates,
						predicateReference,
					)
					if (typeof predicate !== 'string' || predicateDefinition === undefined) {
						throw new Error('should not happen')
					}
					idPermissions = predicate
					predicates[predicate] = predicateDefinition
				}
				fieldPermissions[entity.primary] = idPermissions
				entityPermissions.predicates[idPermissions as Acl.PredicateReference] =
					predicates[idPermissions as Acl.PredicateReference]
			}
		}
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
		let predicates: Acl.PredicateMap = {}
		const operations: Acl.EntityOperations = {}
		if (left.operations.customPrimary || right.operations.customPrimary) {
			operations.customPrimary = true
		}

		const operationNames: (keyof Pick<Acl.EntityOperations, 'create' | 'read' | 'update'>)[] = [
			'create',
			'read',
			'update',
		]

		for (let operation of operationNames) {
			const leftFieldPermissions: Acl.FieldPermissions = left.operations[operation] || {}
			const rightFieldPermissions: Acl.FieldPermissions = right.operations[operation] || {}
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
		const fields: Acl.FieldPermissions = {}
		const predicates: Acl.PredicateMap = {}

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
