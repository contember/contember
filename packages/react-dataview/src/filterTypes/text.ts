import { QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/binding'
import { createGenericTextCellFilterCondition } from './common'
import { DataViewFilterHandler } from '../types'

export type TextFilterArtifactsMatchMode = 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch'

export type TextFilterArtifacts = {
	mode?: TextFilterArtifactsMatchMode
	query?: string
	nullCondition?: boolean
}

export const createTextFilter = (field: SugaredRelativeSingleField['field']): DataViewFilterHandler<TextFilterArtifacts> => (filter, { environment }) => {
	if (!filter.query && filter.nullCondition === undefined) {
		return undefined
	}

	let condition = filter.query !== '' ? createGenericTextCellFilterCondition(filter) : {}

	if (filter.nullCondition === true) {
		condition = {
			or: [condition, { isNull: true }],
		}
	} else if (filter.nullCondition === false) {
		condition = {
			and: [condition, { isNull: false }],
		}
	}

	const desugared = QueryLanguage.desugarRelativeSingleField(field, environment)
	return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
		[desugared.field]: condition,
	})
}
