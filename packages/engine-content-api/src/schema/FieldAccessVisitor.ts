import { Acl, Model } from '@contember/schema'
import { Authorizator } from '../acl'

export class FieldAccessVisitor implements Model.ColumnVisitor<boolean>, Model.RelationVisitor<boolean> {
	constructor(
		private readonly operation: Acl.Operation.create | Acl.Operation.read | Acl.Operation.update,
		private readonly authorizator: Authorizator,
	) {}

	visitColumn(entity: Model.Entity, column: Model.AnyColumn) {
		return this.authorizator.isAllowed(this.operation, entity.name, column.name)
	}

	visitRelation({}, {}, targetEntity: Model.Entity) {
		return this.authorizator.isAllowed(this.operation, targetEntity.name)
	}
}
