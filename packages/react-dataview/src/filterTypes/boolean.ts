import { QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/binding'
import { Input } from '@contember/client'
import { DataViewFilterHandler } from '../types'

export type BooleanFilterArtifacts = {
	includeTrue?: boolean
	includeFalse?: boolean
	nullCondition?: boolean
}

export const createBooleanFilter = (field: SugaredRelativeSingleField['field']): DataViewFilterHandler<BooleanFilterArtifacts> => (filterArtifact, { environment }) => {
	const inclusion: Input.Condition[] = []
	const exclusion: Input.Condition[] = []
	if (filterArtifact.includeTrue) {
		inclusion.push({ eq: true })
	}
	if (filterArtifact.includeFalse) {
		inclusion.push({ eq: false })
	}
	if (filterArtifact.nullCondition === true) {
		inclusion.push({ isNull: true })
	}
	if (filterArtifact.nullCondition === false) {
		exclusion.push({ isNull: false })
	}

	if (inclusion.length === 0 && exclusion.length === 0) {
		return undefined
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
