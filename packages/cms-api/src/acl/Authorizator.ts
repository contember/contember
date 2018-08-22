interface Authorizator {
	isAllowed(operation: Authorizator.Operation, entity: string): boolean

	isAllowed(operation: Authorizator.Operation[], entity: string): boolean

	isAllowed(
		operation: Authorizator.Operation.create | Authorizator.Operation.read | Authorizator.Operation.update,
		entity: string,
		field: string
	): boolean
}

namespace Authorizator {
	export enum Operation {
		read = 'read',
		create = 'create',
		update = 'update',
		delete = 'delete'
	}
}

export default Authorizator
