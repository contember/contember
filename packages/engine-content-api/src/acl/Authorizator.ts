import { Acl } from '@contember/schema'


export type AuthorizationResult = 'yes' | 'no' | 'maybe'

export class Authorizator {
	constructor(private readonly permissions: Acl.Permissions) {
	}

	getEntityPermission(operation: Acl.Operation, entity: string): AuthorizationResult {
		if (!this.permissions[entity]) {
			return 'no'
		}
		const entityPermissions: Acl.EntityPermissions = this.permissions[entity]

		if (operation === Acl.Operation.delete) {
			return this.predicateToResult(entityPermissions.operations.delete)
		}
		const fieldPermissions = entityPermissions.operations[operation]
		if (!fieldPermissions) {
			return 'no'
		}
		return Object.values(fieldPermissions).filter(it => !!it).length > 0 ? 'yes' : 'no'
	}

	getFieldPermissions(operation: Acl.Operation.create | Acl.Operation.read | Acl.Operation.update, entity: string, field: string): AuthorizationResult {
		const fieldPermissions = this.permissions[entity]?.operations[operation]?.[field]
		if (!fieldPermissions) {
			return 'no'
		}
		return this.predicateToResult(fieldPermissions)
	}

	private predicateToResult(predicate: Acl.Predicate | undefined): AuthorizationResult {
		if (!predicate) {
			return 'no'
		}
		if (predicate === true) {
			return 'yes'
		}
		return 'maybe'
	}


	isCustomPrimaryAllowed(entity: string): boolean {
		return this.permissions?.[entity]?.operations?.customPrimary || false
	}
}
