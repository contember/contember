import { QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/binding'
import { DataViewFilterHandler } from '../types'
import { Input } from '@contember/client'

export type NumberRangeFilterArtifacts = {
	from?: number
	to?: number
	nullCondition?: boolean
}

export const createNumberRangeFilter = (field: SugaredRelativeSingleField['field']): DataViewFilterHandler<NumberRangeFilterArtifacts> => (filter, { environment }) => {
	if (filter.from === undefined && filter.to === undefined && filter.nullCondition === undefined) {
		return undefined
	}

	const inclusion: Input.Condition[] = []
	const exclusion: Input.Condition[] = []
	if (filter.from !== undefined || filter.to !== undefined) {
		inclusion.push({
				gte: filter.from,
				lte: filter.to,
			},
		)
	}
	if (filter.nullCondition === true) {
		inclusion.push({ isNull: true })
	}
	if (filter.nullCondition === false) {
		exclusion.push({ isNull: false })
	}

	const desugared = QueryLanguage.desugarRelativeSingleField(field, environment)
	return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
		[desugared.field]: {
			and: [
				{ or: inclusion },
				...exclusion,
			],
		},
	})
}
