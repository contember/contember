import * as React from 'react'
import { ReactNode } from 'react'
import { Input } from '../ui/input'
import { createTextFilter, DataViewFilterHandlerRegistry, DataViewTextFilterInput } from '@contember/react-dataview'
import { dict } from '../../../lib/dict'

export const createDefaultSelectFilter = (filterField?: string): {
	filterTypes?: DataViewFilterHandlerRegistry
	filterToolbar?: ReactNode
} => {
	if (!filterField) {
		return {
			filterTypes: undefined,
			filterToolbar: undefined,
		}
	}
	return {
		filterTypes: { query: createTextFilter(filterField) },
		filterToolbar: (
			<DataViewTextFilterInput name={'query'}>
				<Input placeholder={dict.select.search} className={'w-full'} autoFocus inputSize={'sm'}/>
			</DataViewTextFilterInput>
		),
	}
}
