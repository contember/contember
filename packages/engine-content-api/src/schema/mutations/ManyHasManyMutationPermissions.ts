import { Acl, Model } from '@contember/schema'
import { Authorizator } from '../../acl/index.js'

export interface ManyHasManyMutationPermissions {
	canMutateSourceRelation: boolean
	canMutateTargetRelation: boolean
	canMutateJunction: boolean
}

export interface ManyHasManyMutationOperations {
	source: Acl.Operation.create | Acl.Operation.update
	target: Acl.Operation.create | Acl.Operation.update
}

export const getManyHasManyMutationPermissions = (
	authorizator: Authorizator,
	context: Model.ManyHasManyOwningContext | Model.ManyHasManyInverseContext,
	operations: ManyHasManyMutationOperations,
): ManyHasManyMutationPermissions => {
	const canMutateSourceRelation = authorizator.getFieldPermissions(
		operations.source,
		context.entity.name,
		context.relation.name,
	) !== 'no'
	const canMutateTargetRelation = context.targetRelation === null
		|| authorizator.getFieldPermissions(operations.target, context.targetEntity.name, context.targetRelation.name) !== 'no'
	return {
		canMutateSourceRelation,
		canMutateTargetRelation,
		canMutateJunction: canMutateSourceRelation && canMutateTargetRelation,
	}
}
