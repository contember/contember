import { Filter, QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/binding'
import { DataViewFilterHandler } from '../types'
import { createGenericTextCellFilterCondition } from './common'

export type CoalesceTextFilterArtifacts = {
	mode: 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch'
	query: string
}


export const createCoalesceFilter = (fields: SugaredRelativeSingleField['field'][]): DataViewFilterHandler<CoalesceTextFilterArtifacts> => (filter, { environment }): Filter | undefined => {
	if (filter.query === '') {
		return undefined
	}
	const condition = createGenericTextCellFilterCondition(filter)
	const parts: Filter[] = []
	for (const field of fields) {
		const desugared = QueryLanguage.desugarRelativeSingleField({ field: field }, environment)
		const fieldCondition = wrapFilterInHasOnes(desugared.hasOneRelationPath, {
			[desugared.field]: condition,
		})
		parts.push(fieldCondition)
	}
	return filter.mode === 'doesNotMatch' ? { and: parts } : { or: parts }
}
