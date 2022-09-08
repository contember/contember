import { Acl, Input, Model } from '@contember/schema'
import { Authorizator } from '../../acl'
import { ImplementationException } from '../../exception'

export class CreateEntityRelationAllowedOperationsVisitor implements
	Model.ColumnVisitor<never>,
	Model.RelationByTypeVisitor<Input.CreateRelationOperation[]> {

	constructor(private readonly authorizator: Authorizator) {}

	visitColumn(): never {
		throw new ImplementationException('CreateEntityRelationAllowedOperationsVisitor: Not applicable for a column')
	}

	public visitManyHasManyInverse({ targetEntity, targetRelation }: Model.ManyHasManyInverseContext) {
		return this.getAllowedOperations(targetEntity, targetEntity, targetRelation)
	}

	public visitManyHasManyOwning({ entity, targetEntity, relation }: Model.ManyHasManyOwningContext) {
		return this.getAllowedOperations(targetEntity, entity, relation)
	}

	public visitOneHasMany({ targetEntity, targetRelation }: Model.OneHasManyContext) {
		return this.getAllowedOperations(targetEntity, targetEntity, targetRelation)
	}

	public visitManyHasOne({ targetEntity, entity, relation }: Model.ManyHasOneContext) {
		return this.getAllowedOperations(targetEntity, entity, relation)
	}

	public visitOneHasOneInverse({ targetEntity, targetRelation, relation }: Model.OneHasOneInverseContext) {
		const operations = this.getAllowedOperations(targetEntity, targetEntity, targetRelation)
		if (relation.nullable || targetRelation.nullable) {
			return operations
		}
		return operations.filter(it => it === Input.CreateRelationOperation.create)
	}

	public visitOneHasOneOwning({ targetEntity, entity, relation, targetRelation }: Model.OneHasOneOwningContext) {
		const operations = this.getAllowedOperations(targetEntity, entity, relation)
		if (!targetRelation || targetRelation.nullable || relation.nullable) {
			return operations
		}
		return operations.filter(it => it === Input.CreateRelationOperation.create)
	}

	private getAllowedOperations(
		targetEntity: Model.Entity,
		owningEntity: Model.Entity,
		owningRelation: Model.Relation,
	): Input.CreateRelationOperation[] {
		const result: Input.CreateRelationOperation[] = []

		const canReadTargetEntity = this.authorizator.getEntityPermission(Acl.Operation.read, targetEntity.name) !== 'no'
		const canCreateTargetEntity = this.authorizator.getEntityPermission(Acl.Operation.create, targetEntity.name) !== 'no'
		const canCreateOwning = this.authorizator.getFieldPermissions(Acl.Operation.create, owningEntity.name, owningRelation.name) !== 'no'

		if (canReadTargetEntity && canCreateOwning) {
			result.push(Input.CreateRelationOperation.connect)
		}

		if (canCreateTargetEntity && canCreateOwning) {
			result.push(Input.CreateRelationOperation.create)
		}

		return result
	}
}
