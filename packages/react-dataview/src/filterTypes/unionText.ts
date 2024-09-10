import { Filter, SugaredRelativeSingleField } from '@contember/react-binding'
import { DataViewFilterHandler } from '../types'
import { createTextFilter, TextFilterArtifacts } from './text'


export type DataViewUnionFilterFields = SugaredRelativeSingleField['field'] | SugaredRelativeSingleField['field'][]

const id = Symbol('unionText')

export const createUnionTextFilter = (fields: DataViewUnionFilterFields): DataViewFilterHandler<TextFilterArtifacts> => {
	const filters = (Array.isArray(fields) ? fields.map(it => createTextFilter(it)) : [createTextFilter(fields)])

	const handler: DataViewFilterHandler<TextFilterArtifacts> = (filter, { environment }) => {
		if (filters.length === 0) {
			return undefined
		}
		return {
			or: filters.map(it => it(filter, { environment })!),
		}
	}

	handler.identifier = { id, params: { fields } }
	handler.isEmpty = filter => {
		return !filter.query
	}

	return handler
}
