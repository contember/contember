import { MutationResultList, prependPath } from './Result'
import { Model } from '@contember/schema'

export const hasManyProcessor = <Context extends { relation: Model.AnyRelation; index: number; alias?: string }, Args>(
	innerProcessor: (context: Context) => Promise<MutationResultList | ((args: Args) => Promise<MutationResultList>)>,
) => {
	return async (context: Context): Promise<MutationResultList | ((args: Args) => Promise<MutationResultList>)> => {
		const { relation, index, alias } = context
		const path = [{ field: relation.name }, { index, alias }]
		const innerResult = await innerProcessor(context)
		if (typeof innerResult === 'function') {
			return async (it: Args) => prependPath(path, await innerResult(it))
		}
		return prependPath(path, innerResult)
	}
}

export const hasOneProcessor = <Context extends { relation: Model.AnyRelation }, Args>(
	innerProcessor: (context: Context) => Promise<MutationResultList | ((args: Args) => Promise<MutationResultList>)>,
) => {
	return async (context: Context): Promise<MutationResultList | ((args: Args) => Promise<MutationResultList>)> => {
		const { relation } = context
		const path = [{ field: relation.name }]
		const innerResult = await innerProcessor(context)
		if (typeof innerResult === 'function') {
			return async (it: Args) => prependPath(path, await innerResult(it))
		}
		return prependPath(path, innerResult)
	}
}
