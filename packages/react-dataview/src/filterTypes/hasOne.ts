import { QueryLanguage, SugaredRelativeSingleEntity, wrapFilterInHasOnes } from '@contember/binding'
import { DataViewFilterHandler } from '../types'
import { RelationFilterArtifacts } from './common'

const id = Symbol('hasOne')

export const createHasOneFilter = (field: SugaredRelativeSingleEntity['field']): DataViewFilterHandler<RelationFilterArtifacts> => {
	const handler: DataViewFilterHandler<RelationFilterArtifacts> = (filter, { environment }) => {
		const desugared = QueryLanguage.desugarRelativeSingleEntity({ field }, environment)
		const inclusionConditions = []
		const exclusionConditions = []
		if (filter.id?.length) {
			inclusionConditions.push({ in: filter.id })
		}
		if (filter.nullCondition === true) {
			inclusionConditions.push({ isNull: filter.nullCondition })
		}
		if (filter.notId?.length) {
			exclusionConditions.push({ or: [{ notIn: filter.notId }, { isNull: true }] })
		}
		if (filter.nullCondition === false) {
			exclusionConditions.push({ isNull: false })
		}

		return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
			id: {
				and: [
					{ or: inclusionConditions },
					...exclusionConditions,
				],
			},
		})
	}

	handler.identifier = { id, params: { field } }
	handler.isEmpty = filter => {
		return !filter.id?.length && !filter.notId?.length && filter.nullCondition === undefined
	}

	return handler
}
