import { QueryLanguage, SugaredRelativeSingleEntity, wrapFilterInHasOnes } from '@contember/binding'
import { DataViewFilterHandler } from '../types'
import { SelectCellArtifacts } from './common'

export const createHasOneFilter = (field: SugaredRelativeSingleEntity['field']): DataViewFilterHandler<SelectCellArtifacts> => (filter, { environment }) => {
	if (filter.id.length === 0 && filter.nullCondition === false) {
		return undefined
	}
	const desugared = QueryLanguage.desugarRelativeSingleEntity({ field }, environment)
	const conditions = []
	if (filter.id.length > 0) {
		conditions.push({ in: filter.id })
	}
	if (filter.nullCondition === true) {
		conditions.push({ isNull: true })
	}

	return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
		id: { or: conditions },
	})
}
