import * as React from 'react'
import { Input } from '../ui/input'
import { DataViewFilter, DataViewHasFilterType, DataViewTextFilterInput, createUnionTextFilter } from '@contember/react-dataview'
import { dict } from '../../dict'
import { Component, SugaredRelativeSingleField } from '@contember/interface'

export const SelectDefaultFilter = Component<{
	filterField: SugaredRelativeSingleField['field'] | (SugaredRelativeSingleField['field'][])
}>(() => (
	<SelectDefaultFilterInner />
), ({ filterField }) => {
	return <DataViewFilter name={'query'} filterHandler={createUnionTextFilter(filterField)} />
})


export const SelectDefaultFilterInner = () => (
	<DataViewHasFilterType name={'query'}>
		<DataViewTextFilterInput name={'query'}>
			<Input placeholder={dict.select.search} className={'w-full'} autoFocus inputSize={'sm'} />
		</DataViewTextFilterInput>
	</DataViewHasFilterType>
)
