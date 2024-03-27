import { Filter, SugaredRelativeSingleField } from '@contember/binding'
import { DataViewFilterHandler } from '../types'
import { createTextFilter, TextFilterArtifacts } from './text'


export const createUnionTextFilter = (fields: SugaredRelativeSingleField['field'] | (SugaredRelativeSingleField['field'][])): DataViewFilterHandler<TextFilterArtifacts> => {
	const filters = (Array.isArray(fields) ? fields.map(it => createTextFilter(it)) : [createTextFilter(fields)])

	return (filter, { environment }): Filter | undefined => {
		if (!filter.query) {
			return undefined
		}
		return {
			or: filters.map(it => it(filter, { environment })!),
		}
	}
}
