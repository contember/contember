import { Acl } from 'cms-common'

export default class PermissionMerger {
	public merge(acl: Acl.Schema, roles: string[]): Acl.Permissions {
		let result: Acl.Permissions = {}
		for (let role of roles) {
			const roleDefinition = acl.roles[role]
			let rolePermissions: Acl.Permissions = roleDefinition.entities
			if (roleDefinition.inherits) {
				rolePermissions = this.mergePermissions(this.merge(acl, roleDefinition.inherits), rolePermissions)
			}
			result = this.mergePermissions(result, rolePermissions)
		}

		return result
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

		const operationNames: (keyof Pick<Acl.EntityOperations, 'create' | 'read' | 'update'>)[] = [
			'create',
			'read',
			'update'
		]
		for (let operation of operationNames) {
			const leftFieldPermissions: Acl.FieldPermissions = left.operations[operation] || {}
			const rightFieldPermissions: Acl.FieldPermissions = right.operations[operation] || {}
			const [operationPredicates, fieldPermissions] = this.mergeFieldPermissions(
				left.predicates,
				leftFieldPermissions,
				right.predicates,
				rightFieldPermissions
			)
			predicates = { ...predicates, ...operationPredicates }
			if (Object.keys(fieldPermissions).length > 0) {
				operations[operation] = fieldPermissions
			}
		}

		const [predicateDefinition, predicate] = this.mergePredicates(
			left.predicates,
			left.operations.delete,
			right.predicates,
			right.operations.delete
		)
		if (predicate === true) {
			operations.delete = true
		} else if (predicateDefinition !== undefined && typeof predicate === 'string') {
			predicates[predicate] = predicateDefinition
			operations.delete = predicate
		}

		return {
			predicates: predicates,
			operations: operations
		}
	}

	private mergeFieldPermissions(
		leftPredicates: Acl.PredicateMap,
		leftFieldPermissions: Acl.FieldPermissions,
		rightPredicates: Acl.PredicateMap,
		rightFieldPermissions: Acl.FieldPermissions
	): [Acl.PredicateMap, Acl.FieldPermissions] {
		const fields: Acl.FieldPermissions = {}
		const predicates: Acl.PredicateMap = {}

		for (let field in { ...leftFieldPermissions, ...rightFieldPermissions }) {
			const [predicateDefinition, predicate] = this.mergePredicates(
				leftPredicates,
				leftFieldPermissions[field],
				rightPredicates,
				rightFieldPermissions[field]
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
		leftReference: Acl.Predicate | undefined,
		rightPredicates: Acl.PredicateMap,
		rightReference: Acl.Predicate | undefined
	): [Acl.PredicateDefinition, Acl.PredicateReference] | [undefined, boolean] {
		if (leftReference === true || rightReference === true) {
			return [undefined, true]
		}

		if (leftReference !== undefined && rightReference !== undefined) {
			const leftPredicate: Acl.PredicateDefinition = leftPredicates[leftReference]
			const rightPredicate: Acl.PredicateDefinition = rightPredicates[rightReference]
			let predicateName = '__merge__' + leftReference + '__' + rightReference
			while (leftPredicates[predicateName]) {
				predicateName += '_'
			}
			return [
				{
					or: [leftPredicate, rightPredicate]
				} as Acl.PredicateDefinition,
				predicateName
			]
		} else if (leftReference !== undefined) {
			return [leftPredicates[leftReference], leftReference]
		} else if (rightReference !== undefined) {
			let predicateName = rightReference
			while (leftPredicates[predicateName]) {
				predicateName += '_'
			}
			return [rightPredicates[rightReference], predicateName]
		} else {
			return [undefined, false]
		}
	}
}
