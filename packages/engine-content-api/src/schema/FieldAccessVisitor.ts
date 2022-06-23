import { Acl, Model } from '@contember/schema'
import { Authorizator } from '../acl/index.js'

export class FieldAccessVisitor implements Model.ColumnVisitor<boolean>, Model.RelationVisitor<boolean> {
	constructor(
		private readonly operation: Acl.Operation.create | Acl.Operation.read | Acl.Operation.update,
		private readonly authorizator: Authorizator,
	) {}

	visitColumn(entity: Model.Entity, column: Model.AnyColumn) {
		return this.authorizator.getFieldPermissions(this.operation, entity.name, column.name) !== 'no'
	}

	visitRelation({}, {}, targetEntity: Model.Entity) {
		return this.authorizator.getEntityPermission(this.operation, targetEntity.name) !== 'no'
	}
}
