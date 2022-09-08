import { Acl, Model } from '@contember/schema'
import { Authorizator } from '../acl'

export class FieldAccessVisitor implements Model.ColumnVisitor<boolean>, Model.RelationVisitor<boolean> {
	constructor(
		private readonly operation: Acl.Operation.create | Acl.Operation.read | Acl.Operation.update,
		private readonly authorizator: Authorizator,
	) {}

	visitColumn({ column, entity }: Model.ColumnContext) {
		return this.authorizator.getFieldPermissions(this.operation, entity.name, column.name) !== 'no'
	}

	visitRelation({ targetEntity }: Model.AnyRelationContext) {
		return this.authorizator.getEntityPermission(this.operation, targetEntity.name) !== 'no'
	}
}
