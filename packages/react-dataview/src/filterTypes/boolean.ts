import { QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/binding'
import { Input } from '@contember/client'
import { DataViewFilterHandler } from '../types'

export type BooleanFilterArtifacts = {
	includeTrue: boolean
	includeFalse: boolean
	includeNull: boolean
}

export const createBooleanFilter = (field: SugaredRelativeSingleField['field']): DataViewFilterHandler<BooleanFilterArtifacts> => (filterArtifact, { environment }) => {
	const conditions: Input.Condition<boolean>[] = []

	if (filterArtifact.includeTrue) {
		conditions.push({ eq: true })
	}
	if (filterArtifact.includeFalse) {
		conditions.push({ eq: false })
	}
	if (filterArtifact.includeNull) {
		conditions.push({ isNull: true })
	}
	if (conditions.length === 0 || conditions.length === 3) {
		return undefined
	}

	const desugared = QueryLanguage.desugarRelativeSingleField(field, environment)

	return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
		[desugared.field]: conditions.length > 1 ? { or: conditions } : conditions[0],
	})
}
