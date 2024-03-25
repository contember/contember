import * as React from 'react'
import { Input } from '../ui/input'
import { DataViewHasFilterType, DataViewTextFilterInput } from '@contember/react-dataview'
import { dict } from '../../dict'


export const SelectDefaultFilter = () => {
	return (
		<DataViewHasFilterType name={'query'}>
			<DataViewTextFilterInput name={'query'}>
				<Input placeholder={dict.select.search} className={'w-full'} autoFocus inputSize={'sm'} />
			</DataViewTextFilterInput>
		</DataViewHasFilterType>
	)
}
