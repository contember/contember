import * as React from 'react'
import { Input } from '../ui/input'
import { DataViewHasFilterType, DataViewQueryFilterName, DataViewTextFilterInput } from '@contember/react-dataview'
import { dict } from '../dict'


export const SelectDefaultFilter = () => (
	<DataViewHasFilterType name={DataViewQueryFilterName}>
		<DataViewTextFilterInput name={DataViewQueryFilterName}>
			<Input placeholder={dict.select.search} className={'w-full'} autoFocus inputSize={'sm'} />
		</DataViewTextFilterInput>
	</DataViewHasFilterType>
)
