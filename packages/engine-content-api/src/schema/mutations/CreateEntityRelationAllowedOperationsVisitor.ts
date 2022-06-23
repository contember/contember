import { Acl, Input, Model } from '@contember/schema'
import { Authorizator } from '../../acl/index.js'
import { ImplementationException } from '../../exception.js'

export class CreateEntityRelationAllowedOperationsVisitor implements
	Model.ColumnVisitor<never>,
	Model.RelationByTypeVisitor<Input.CreateRelationOperation[]> {

	constructor(private readonly authorizator: Authorizator) {}

	visitColumn(): never {
		throw new ImplementationException('CreateEntityRelationAllowedOperationsVisitor: Not applicable for a column')
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
		return this.getAllowedOperations(targetEntity, entity, relation)
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
		return operations.filter(it => it === Input.CreateRelationOperation.create)
	}

	public visitOneHasOneOwning(
		entity: Model.Entity,
		relation: Model.OneHasOneOwningRelation,
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
