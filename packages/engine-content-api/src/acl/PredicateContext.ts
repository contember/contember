import type { Model } from '@contember/schema'

export type PredicatePermissionScope = 'root' | 'through'

const evaluatedRelationPathBrand = Symbol('evaluatedRelationPath')

/**
 * Proof that a query has already evaluated every relation in this path. Only query traversal
 * creates this value; mutation access may select the through permission scope without it.
 */
export interface EvaluatedRelationPath {
	readonly [evaluatedRelationPathBrand]: readonly Model.AnyRelationContext[]
}

export interface PredicateContext {
	readonly scope: PredicatePermissionScope
	readonly evaluatedRelationPath?: EvaluatedRelationPath
}

export const rootPredicateContext: PredicateContext = { scope: 'root' }
export const throughPredicateContext: PredicateContext = { scope: 'through' }

export const createPredicateContext = (scope: PredicatePermissionScope): PredicateContext =>
	scope === 'root' ? rootPredicateContext : throughPredicateContext

export const createEvaluatedRelationPath = (relationPath: readonly Model.AnyRelationContext[]): EvaluatedRelationPath => ({
	[evaluatedRelationPathBrand]: relationPath,
})

export const createPredicateContextWithEvaluatedRelationPath = (
	scope: PredicatePermissionScope,
	relationPath: readonly Model.AnyRelationContext[],
): PredicateContext => ({
	scope,
	evaluatedRelationPath: createEvaluatedRelationPath(relationPath),
})

export const createPredicateContextForEvaluatedRelationPath = (
	relationPath: readonly Model.AnyRelationContext[],
): PredicateContext => createPredicateContextWithEvaluatedRelationPath(relationPath.length === 0 ? 'root' : 'through', relationPath)

export const getEvaluatedRelationPath = (context: PredicateContext): readonly Model.AnyRelationContext[] | undefined =>
	context.evaluatedRelationPath?.[evaluatedRelationPathBrand]
