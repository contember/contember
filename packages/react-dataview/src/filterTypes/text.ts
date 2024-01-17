import { QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/binding'
import { createGenericTextCellFilterCondition } from './common'
import { DataViewFilterHandler } from '../types'

export type TextFilterArtifacts = {
	mode: 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch'
	query: string
	nullCondition: boolean
}

export const createTextFilter = (field: SugaredRelativeSingleField['field']): DataViewFilterHandler<TextFilterArtifacts> => (filter, { environment }) => {
	if (filter.query === '' && filter.nullCondition === false) {
		return undefined
	}

	let condition = filter.query !== '' ? createGenericTextCellFilterCondition(filter) : {}

	if (filter.mode === 'doesNotMatch') {
		if (filter.nullCondition) {
			condition = {
				and: [condition, { isNull: false }],
			}
		}
	} else if (filter.nullCondition) {
		condition = {
			or: [condition, { isNull: true }],
		}
	}

	const desugared = QueryLanguage.desugarRelativeSingleField(field, environment)
	return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
		[desugared.field]: condition,
	})
}
