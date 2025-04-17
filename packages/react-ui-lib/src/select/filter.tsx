import { Input } from '../ui/input'
import { DataViewHasFilterType, DataViewQueryFilterName, DataViewTextFilterInput } from '@contember/react-dataview'
import { dict } from '../dict'
import { memo } from 'react'

/**
 * `SelectDefaultFilter` is component for filtering data in a `SelectDataView`.
 * It checks if a specific filter type exists and, if so, renders a text input for filtering.
 */
export const SelectDefaultFilter = memo(() => (
	<DataViewHasFilterType name={DataViewQueryFilterName}>
		<DataViewTextFilterInput name={DataViewQueryFilterName}>
			<Input placeholder={dict.select.search} className={'w-full'} autoFocus inputSize={'sm'} />
		</DataViewTextFilterInput>
	</DataViewHasFilterType>
))
