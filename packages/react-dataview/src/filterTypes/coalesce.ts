import { Filter, SugaredRelativeSingleField } from '@contember/binding'
import { DataViewFilterHandler } from '../types'
import { createTextFilter, TextFilterArtifacts } from './text'

export type CoalesceTextFilterArtifacts = {
	mode?: 'matches' | 'matchesExactly' | 'startsWith' | 'endsWith' | 'doesNotMatch'
	query?: string
}


export const createCoalesceFilter = (fields: SugaredRelativeSingleField['field'][]): DataViewFilterHandler<TextFilterArtifacts> => {
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
