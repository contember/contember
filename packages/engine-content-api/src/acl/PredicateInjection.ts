import { Input, Model } from '@contember/schema'

/**
 * Read filters keep the user condition separate from target-row read guards until SQL lowering.
 * The guard is structural data, so optimizer-created where objects cannot lose its provenance.
 */
export interface RelationPredicateGuard {
	create(
		relationContext: Model.AnyRelationContext,
		where: Input.OptionalWhere,
		traversedRelationPath: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere
}

export interface PredicateInjection {
	readonly where: Input.OptionalWhere
	readonly guard?: Input.OptionalWhere
	readonly relationGuard: RelationPredicateGuard
}
