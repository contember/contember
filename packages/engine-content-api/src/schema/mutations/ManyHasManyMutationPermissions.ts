import { Acl, Model } from '@contember/schema'
import { Authorizator } from '../../acl/index.js'

export interface ManyHasManyMutationPermissions {
	canMutateSourceRelation: boolean
	canMutateJunction: boolean
}

export const getManyHasManyMutationPermissions = (
	authorizator: Authorizator,
	context: Model.ManyHasManyOwningContext | Model.ManyHasManyInverseContext,
	operation: Acl.Operation.create | Acl.Operation.update,
): ManyHasManyMutationPermissions => {
	const canMutateSourceRelation = authorizator.getFieldPermissions(
		operation,
		context.entity.name,
		context.relation.name,
	) !== 'no'
	const canMutateTargetRelation = context.targetRelation === null
		|| authorizator.getFieldPermissions(operation, context.targetEntity.name, context.targetRelation.name) !== 'no'
	return {
		canMutateSourceRelation,
		canMutateJunction: canMutateSourceRelation && canMutateTargetRelation,
	}
}
