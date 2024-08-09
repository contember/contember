import { QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/react-binding'
import { DataViewFilterHandler } from '../types'
import { Input } from '@contember/client'

export type NumberFilterArtifacts = {
	mode: 'eq' | 'gte' | 'lte'
	query: number | null
	nullCondition: boolean
}

const id = Symbol('number')

export const createNumberFilter = (field: SugaredRelativeSingleField['field']): DataViewFilterHandler<NumberFilterArtifacts> => {
	const handler: DataViewFilterHandler<NumberFilterArtifacts> = (filter, { environment }) => {
		const baseOperators = {
			eq: 'eq',
			gte: 'gte',
			lte: 'lte',
		}

		const conditions: Input.Condition[] = []
		if (filter.query !== null) {
			conditions.push({
				[baseOperators[filter.mode]]: filter.query,
			})
		}
		if (filter.nullCondition) {
			conditions.push({ isNull: true })
		}

		const desugared = QueryLanguage.desugarRelativeSingleField(field, environment)
		return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
			[desugared.field]: { or: conditions },
		})
	}

	handler.identifier = { id, params: { field } }
	handler.isEmpty = filter => {
		return filter.query === null && !filter.nullCondition
	}

	return handler
}
