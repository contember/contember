import { Filter, SugaredRelativeSingleField } from '@contember/binding'
import { DataViewFilterHandler } from '../types'
import { createTextFilter, TextFilterArtifacts } from './text'


export const createUnionTextFilter = (fields: SugaredRelativeSingleField['field'][]): DataViewFilterHandler<TextFilterArtifacts> => {
	const filters = fields.map(it => createTextFilter(it))

	return (filter, { environment }): Filter | undefined => {
		if (!filter.query) {
			return undefined
		}
		return {
			or: filters.map(it => it(filter, { environment })!),
		}
	}
}
