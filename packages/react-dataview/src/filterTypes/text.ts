import { QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/react-binding'
import { createGenericTextCellFilterCondition } from './common'
import { DataViewFilterHandler } from '../types'

export type TextFilterArtifactsMatchMode = 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch'

export type TextFilterArtifacts = {
	mode?: TextFilterArtifactsMatchMode
	query?: string
	nullCondition?: boolean
}

const id = Symbol('text')

export const createTextFilter = (field: SugaredRelativeSingleField['field']): DataViewFilterHandler<TextFilterArtifacts> => {
	const handler: DataViewFilterHandler<TextFilterArtifacts> = (filter, { environment }) => {
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

	handler.identifier = { id, params: { field } }
	handler.isEmpty = filter => {
		return !filter.query && filter.nullCondition === undefined
	}

	return handler
}
