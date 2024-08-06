import { Filter, QueryLanguage, SugaredRelativeEntityList, wrapFilterInHasOnes } from '@contember/react-binding'
import { DataViewFilterHandler } from '../types'
import { RelationFilterArtifacts } from './common'

const id = Symbol('hasMany')

export const createHasManyFilter = (field: SugaredRelativeEntityList['field']): DataViewFilterHandler<RelationFilterArtifacts> => {
	const handler: DataViewFilterHandler<RelationFilterArtifacts> = (filter, { environment }) => {
		const desugared = QueryLanguage.desugarRelativeEntityList({ field }, environment)

		const inclusionConditions: Filter[] = []
		const exclusionConditions: Filter[] = []
		if (filter.id?.length) {
			inclusionConditions.push(wrapFilterInHasOnes(desugared.hasOneRelationPath, {
				[desugared.hasManyRelation.field]: {
					id: { in: filter.id },
				},
			}))
		}
		if (filter.nullCondition === true) {
			inclusionConditions.push({
				not: wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.hasManyRelation.field]: {
						id: { isNull: false },
					},
				}),
			})
		}
		if (filter.notId?.length) {
			exclusionConditions.push({
				not: wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.hasManyRelation.field]: {
						id: { in: filter.notId },
					},
				}),
			})
		}
		if (filter.nullCondition === false) {
			exclusionConditions.push(wrapFilterInHasOnes(desugared.hasOneRelationPath, {
				[desugared.hasManyRelation.field]: {
					id: { isNull: false },
				},
			}))
		}

		return {
			and: [
				{ or: inclusionConditions },
				...exclusionConditions,
			],
		}
	}

	handler.identifier = { id, params: { field } }
	handler.isEmpty = filter => {
		return !filter.id?.length && !filter.notId?.length && filter.nullCondition === undefined
	}

	return handler
}
