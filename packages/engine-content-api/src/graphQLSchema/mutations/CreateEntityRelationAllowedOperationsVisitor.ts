import { Acl, Input, Model } from '@contember/schema'
import Authorizator from '../../acl/Authorizator'
import { ImplementationException } from '../../exception'

export default class CreateEntityRelationAllowedOperationsVisitor
	implements Model.ColumnVisitor<never>, Model.RelationByTypeVisitor<Input.CreateRelationOperation[]> {
	constructor(private readonly authorizator: Authorizator) {}

	visitColumn(): never {
		throw new ImplementationException('CreateEntityRelationAllowedOperationsVisitor: Not applicable for a column')
	}

	public visitManyHasManyInverse({}, {}, targetEntity: Model.Entity, targetRelation: Model.ManyHasManyOwnerRelation) {
		return this.getAllowedOperations(targetEntity, targetEntity, targetRelation)
	}

	public visitManyHasManyOwner(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		targetEntity: Model.Entity,
	) {
		return this.getAllowedOperations(targetEntity, entity, relation)
	}

	public visitOneHasMany({}, {}, targetEntity: Model.Entity, targetRelation: Model.ManyHasOneRelation) {
		return this.getAllowedOperations(targetEntity, targetEntity, targetRelation)
	}

	public visitManyHasOne(entity: Model.Entity, relation: Model.ManyHasOneRelation, targetEntity: Model.Entity) {
		return this.getAllowedOperations(targetEntity, entity, relation)
	}

	public visitOneHasOneInverse(
		{},
		relation: Model.OneHasOneInverseRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneOwnerRelation,
	) {
		const operations = this.getAllowedOperations(targetEntity, targetEntity, targetRelation)
		if (relation.nullable || targetRelation.nullable) {
			return operations
		}
		return operations.filter(it => it === Input.CreateRelationOperation.create)
	}

	public visitOneHasOneOwner(
		entity: Model.Entity,
		relation: Model.OneHasOneOwnerRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneInverseRelation | null,
	) {
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

		const canReadTargetEntity = this.authorizator.isAllowed(Acl.Operation.read, targetEntity.name)
		const canCreateTargetEntity = this.authorizator.isAllowed(Acl.Operation.create, targetEntity.name)
		const canCreateOwning = this.authorizator.isAllowed(Acl.Operation.create, owningEntity.name, owningRelation.name)

		if (canReadTargetEntity && canCreateOwning) {
			result.push(Input.CreateRelationOperation.connect)
		}

		if (canCreateTargetEntity && canCreateOwning) {
			result.push(Input.CreateRelationOperation.create)
		}

		return result
	}
}
