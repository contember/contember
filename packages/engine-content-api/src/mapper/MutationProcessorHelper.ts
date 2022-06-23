import { MutationResultList, prependPath } from './Result.js'
import { Model } from '@contember/schema'

export const hasManyProcessor = <Context extends { relation: Model.AnyRelation; index: number; alias?: string }>(
	innerProcessor: (context: Context) => Promise<MutationResultList>,
) => {
	return async (context: Context): Promise<MutationResultList> => {
		const { relation, index, alias } = context
		const path = [{ field: relation.name }, { index, alias }]
		return prependPath(path, await innerProcessor(context))
	}
}

export const hasOneProcessor = <Context extends { relation: Model.AnyRelation }>(
	innerProcessor: (context: Context) => Promise<MutationResultList>,
) => {
	return async (context: Context): Promise<MutationResultList> => {
		const { relation } = context
		const path = [{ field: relation.name }]
		return prependPath(path, await innerProcessor(context))
	}
}
