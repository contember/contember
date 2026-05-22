import * as React from 'react'
import { Input } from '@contember/react-ui-lib-base'
import { DataViewHasFilterType, DataViewQueryFilterName, DataViewTextFilterInput } from '@contember/react-dataview'
import { dict } from '@contember/react-ui-lib-base'
import { memo } from 'react'

export const SelectDefaultFilter = memo(() => (
	<DataViewHasFilterType name={DataViewQueryFilterName}>
		<DataViewTextFilterInput name={DataViewQueryFilterName}>
			<Input placeholder={dict.select.search} className={'w-full'} autoFocus inputSize={'sm'} />
		</DataViewTextFilterInput>
	</DataViewHasFilterType>
))
