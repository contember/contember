import { QueryLanguage, SugaredRelativeEntityList, wrapFilterInHasOnes } from '@contember/binding'
import { DataViewFilterHandler } from '../types'
import { SelectCellArtifacts } from './common'

export const createHasManyFilter = (field: SugaredRelativeEntityList['field']): DataViewFilterHandler<SelectCellArtifacts> => (filter, { environment }) => {
	if (filter.id.length === 0 && filter.nullCondition === false) {
		return undefined
	}
	const desugared = QueryLanguage.desugarRelativeEntityList({ field }, environment)
	const ors = []
	if (filter.id.length > 0) {
		ors.push(wrapFilterInHasOnes(desugared.hasOneRelationPath, {
			[desugared.hasManyRelation.field]: {
				id: { in: filter.id },
			},
		}))
	}
	if (filter.nullCondition === true) {
		ors.push({
			not: wrapFilterInHasOnes(desugared.hasOneRelationPath, {
				[desugared.hasManyRelation.field]: {
					id: { isNull: false },
				},
			}),
		})
	}

	return { or: ors }
}
