import { Acl, Input, Model } from '@contember/schema'
import { Authorizator } from '../../acl'

export class UpdateEntityRelationAllowedOperationsVisitor implements
	Model.ColumnVisitor<never>,
	Model.RelationByTypeVisitor<Input.UpdateRelationOperation[]> {

	constructor(private readonly authorizator: Authorizator) {}

	visitColumn(): never {
		throw new Error('UpdateEntityRelationAllowedOperationsVisitor: Not applicable for a column')
	}

	public visitManyHasManyInverse({}, {}, targetEntity: Model.Entity, targetRelation: Model.ManyHasManyOwningRelation) {
		return this.getAllowedOperations(targetEntity, targetEntity, targetRelation)
	}

	public visitManyHasManyOwning(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		targetEntity: Model.Entity,
	) {
		return this.getAllowedOperations(targetEntity, entity, relation)
	}

	public visitOneHasMany({}, {}, targetEntity: Model.Entity, targetRelation: Model.ManyHasOneRelation) {
		return this.getAllowedOperations(targetEntity, targetEntity, targetRelation)
	}

	public visitManyHasOne(entity: Model.Entity, relation: Model.ManyHasOneRelation, targetEntity: Model.Entity) {
		const operations = this.getAllowedOperations(targetEntity, entity, relation)
		if (relation.nullable) {
			return operations
		}
		const forbiddenOperations = [Input.UpdateRelationOperation.disconnect]
		if (relation.joiningColumn.onDelete !== Model.OnDelete.cascade) {
			forbiddenOperations.push(Input.UpdateRelationOperation.delete)
		}
		return operations.filter(it => !forbiddenOperations.includes(it))
	}

	public visitOneHasOneInverse(
		{},
		relation: Model.OneHasOneInverseRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneOwningRelation,
	) {
		const operations = this.getAllowedOperations(targetEntity, targetEntity, targetRelation)
		if (relation.nullable || targetRelation.nullable) {
			return operations
		}
		return operations.filter(it => it === Input.UpdateRelationOperation.update)
	}

	public visitOneHasOneOwning(
		entity: Model.Entity,
		relation: Model.OneHasOneOwningRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneInverseRelation | null,
	) {
		const operations = this.getAllowedOperations(targetEntity, entity, relation)
		if (relation.nullable || !targetRelation || targetRelation.nullable) {
			return operations
		}
		const allowedOperations = [Input.UpdateRelationOperation.update]
		if (relation.joiningColumn.onDelete === Model.OnDelete.cascade) {
			allowedOperations.push(Input.UpdateRelationOperation.delete)
		}
		return operations.filter(it => allowedOperations.includes(it))
	}

	private getAllowedOperations(
		targetEntity: Model.Entity,
		owningEntity: Model.Entity,
		owningRelation: Model.Relation,
	): Input.UpdateRelationOperation[] {
		const result: Input.UpdateRelationOperation[] = []

		const canReadTargetEntity = this.authorizator.getEntityPermission(Acl.Operation.read, targetEntity.name) !== 'no'
		const canCreateTargetEntity = this.authorizator.getEntityPermission(Acl.Operation.create, targetEntity.name) !== 'no'
		const canUpdateTargetEntity = this.authorizator.getEntityPermission(Acl.Operation.update, targetEntity.name) !== 'no'
		const canDeleteTargetEntity = this.authorizator.getEntityPermission(Acl.Operation.delete, targetEntity.name) !== 'no'
		const canUpdateOwningRelation = this.authorizator.getFieldPermissions(Acl.Operation.update, owningEntity.name, owningRelation.name) !== 'no'

		if (canReadTargetEntity && canUpdateOwningRelation) {
			result.push(Input.UpdateRelationOperation.connect)
			result.push(Input.UpdateRelationOperation.disconnect)
		}

		if (canCreateTargetEntity && canUpdateOwningRelation) {
			result.push(Input.UpdateRelationOperation.create)
		}
		if (canUpdateTargetEntity && canUpdateOwningRelation) {
			result.push(Input.UpdateRelationOperation.update)
		}
		if (canCreateTargetEntity && canUpdateTargetEntity && canUpdateOwningRelation) {
			result.push(Input.UpdateRelationOperation.upsert)
		}
		if (canDeleteTargetEntity && canUpdateOwningRelation) {
			result.push(Input.UpdateRelationOperation.delete)
		}

		return result
	}
}
