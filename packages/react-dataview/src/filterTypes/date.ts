import { QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/binding'
import { Input } from '@contember/client'
import { DataViewFilterHandler } from '../types'

export type DateRangeFilterArtifacts = {
	start: string | null
	end: string | null
}

export const createDateFilter = (field: SugaredRelativeSingleField['field']): DataViewFilterHandler<DateRangeFilterArtifacts> => (filterArtifact, { environment }) => {
	if (!filterArtifact.start && !filterArtifact.end) {
		return undefined
	}
	const desugared = QueryLanguage.desugarRelativeSingleField(field, environment)

	const conditions: Input.Condition<Input.ColumnValue>[] = []

	if (filterArtifact.start) {
		conditions.push({ gte: filterArtifact.start })
	}
	if (filterArtifact.end) {
		conditions.push({ lte: filterArtifact.end })
	}

	return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
		[desugared.field]: conditions.length > 1 ? { and: conditions } : conditions[0],
	})
}
