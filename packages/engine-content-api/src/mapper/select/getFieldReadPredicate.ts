import { Acl, Model } from '@contember/schema'
import { PredicateFactory } from '../../acl/index.js'

export const getFieldReadPredicate = (
	predicateFactory: PredicateFactory,
	entity: Model.Entity,
	field: Model.AnyField,
	relationPath: readonly Model.AnyRelationContext[],
): Acl.Predicate | undefined => {
	const fieldPredicate = predicateFactory.getFieldReadPredicate(entity, field.name, relationPath)
	return fieldPredicate.isSameAsPrimary ? undefined : fieldPredicate.predicate
}
