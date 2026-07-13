import { Acl, Model } from '@contember/schema'
import { PredicateFactory } from '../../acl/index.js'
import type { FieldRequiredPredicate } from '../../acl/index.js'

export const getFieldPredicate = (
	predicateFactory: PredicateFactory,
	operation: Acl.Operation.read | Acl.Operation.update,
	entity: Model.Entity,
	field: Model.AnyField,
	relationPath: readonly Model.AnyRelationContext[],
): FieldRequiredPredicate =>
	predicateFactory.getFieldPredicate(
		entity,
		operation,
		field.name,
		relationPath.length === 0 ? 'root' : 'through',
	)

export const getFieldReadPredicate = (
	predicateFactory: PredicateFactory,
	entity: Model.Entity,
	field: Model.AnyField,
	relationPath: readonly Model.AnyRelationContext[],
): Acl.Predicate | undefined => {
	const fieldPredicate = getFieldPredicate(predicateFactory, Acl.Operation.read, entity, field, relationPath)
	return fieldPredicate.isSameAsPrimary ? undefined : fieldPredicate.predicate
}
