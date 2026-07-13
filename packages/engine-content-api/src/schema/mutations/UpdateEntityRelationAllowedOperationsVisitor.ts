import { Acl, Input, Model } from '@contember/schema'
import { Authorizator } from '../../acl/index.js'
import { getManyHasManyMutationPermissions } from './ManyHasManyMutationPermissions.js'

export class UpdateEntityRelationAllowedOperationsVisitor
	implements Model.ColumnVisitor<never>, Model.RelationByTypeVisitor<Input.UpdateRelationOperation[]>
{
	constructor(private readonly authorizator: Authorizator) {}

	visitColumn(): never {
		throw new Error('UpdateEntityRelationAllowedOperationsVisitor: Not applicable for a column')
	}

	public visitManyHasManyInverse(context: Model.ManyHasManyInverseContext) {
		return this.getAllowedManyHasManyOperations(context)
	}

	public visitManyHasManyOwning(context: Model.ManyHasManyOwningContext) {
		return this.getAllowedManyHasManyOperations(context)
	}

	public visitOneHasMany({ targetRelation, targetEntity }: Model.OneHasManyContext) {
		return this.getAllowedOperations(targetEntity, targetEntity, targetRelation)
	}

	public visitManyHasOne({ targetEntity, relation, entity }: Model.ManyHasOneContext) {
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

	public visitOneHasOneInverse({ relation, targetEntity, targetRelation }: Model.OneHasOneInverseContext) {
		const operations = this.getAllowedOperations(targetEntity, targetEntity, targetRelation)
		if (relation.nullable || targetRelation.nullable) {
			return operations
		}
		return operations.filter(it => it === Input.UpdateRelationOperation.update)
	}

	public visitOneHasOneOwning({ targetEntity, entity, relation, targetRelation }: Model.OneHasOneOwningContext) {
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
		if (canReadTargetEntity && canUpdateOwningRelation && canCreateTargetEntity) {
			result.push(Input.UpdateRelationOperation.connectOrCreate)
		}

		return result
	}

	private getAllowedManyHasManyOperations(
		context: Model.ManyHasManyOwningContext | Model.ManyHasManyInverseContext,
	): Input.UpdateRelationOperation[] {
		const { targetEntity } = context
		const { canMutateSourceRelation, canMutateJunction } = getManyHasManyMutationPermissions(
			this.authorizator,
			context,
			Acl.Operation.update,
		)
		if (!canMutateSourceRelation) {
			return []
		}
		const result: Input.UpdateRelationOperation[] = []
		const canReadTarget = this.authorizator.getEntityPermission(Acl.Operation.read, targetEntity.name) !== 'no'
		const canCreateTarget = this.authorizator.getEntityPermission(Acl.Operation.create, targetEntity.name) !== 'no'
		const canUpdateTarget = this.authorizator.getEntityPermission(Acl.Operation.update, targetEntity.name) !== 'no'
		const canDeleteTarget = this.authorizator.getEntityPermission(Acl.Operation.delete, targetEntity.name) !== 'no'
		if (canMutateJunction && canReadTarget) {
			result.push(Input.UpdateRelationOperation.connect, Input.UpdateRelationOperation.disconnect)
		}
		if (canMutateJunction && canCreateTarget) {
			result.push(Input.UpdateRelationOperation.create)
		}
		if (canMutateJunction && canUpdateTarget) {
			result.push(Input.UpdateRelationOperation.update)
		}
		if (canMutateJunction && canCreateTarget && canUpdateTarget) {
			result.push(Input.UpdateRelationOperation.upsert)
		}
		if (canDeleteTarget) {
			result.push(Input.UpdateRelationOperation.delete)
		}
		if (canMutateJunction && canReadTarget && canCreateTarget) {
			result.push(Input.UpdateRelationOperation.connectOrCreate)
		}
		return result
	}
}
