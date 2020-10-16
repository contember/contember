import { Acl } from '@contember/schema'

interface Authorizator {
	isAllowed(operation: Acl.Operation, entity: string): boolean

	isAllowed(
		operation: Acl.Operation.create | Acl.Operation.read | Acl.Operation.update,
		entity: string,
		field: string,
	): boolean

	isCustomPrimaryAllowed(entity: string): boolean
}

export default Authorizator
