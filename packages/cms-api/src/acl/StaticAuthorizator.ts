import { Acl } from 'cms-common'
import Authorizator from './Authorizator'

export default class StaticAuthorizator implements Authorizator {
	constructor(private readonly permissions: Acl.Permissions) {}

	isAllowed(operation: Acl.Operation | Acl.Operation[], entity: string, field?: string): boolean {
		if (!this.permissions[entity]) {
			return false
		}
		const entityPermissions: Acl.EntityPermissions = this.permissions[entity]
		const operations = Array.isArray(operation) ? operation : [operation]

		return operations.every(operation => {
			if (operation === Acl.Operation.delete) {
				return !!entityPermissions.operations.delete
			}
			const fieldPermissions = entityPermissions.operations[operation]
			if (!fieldPermissions) {
				return false
			}
			return !field || !!fieldPermissions[field]
		})
	}
}
