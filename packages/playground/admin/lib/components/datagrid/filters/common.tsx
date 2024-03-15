import * as React from 'react'
import { ReactEventHandler, useCallback } from 'react'
import { useDataViewNullFilter } from '@contember/react-dataview'
import { DataViewFilterSelectItemUI } from '../ui'
import { dict } from '../../../dict'

export const DataViewNullFilter = ({ name }: {
	name: string
}) => {

	const [nullFilter, setNullFilter] = useDataViewNullFilter(name)
	const toggleExcludeNull = useCallback(() => setNullFilter('toggleExclude'), [setNullFilter])
	const toggleIncludeNull = useCallback(() => setNullFilter('toggleInclude'), [setNullFilter])

	return <>
		<DataViewFilterSelectItemUI
			onExclude={toggleExcludeNull}
			onInclude={toggleIncludeNull}
			isExcluded={nullFilter === 'exclude'}
			isIncluded={nullFilter === 'include'}
		>
			<span className={'italic'}>
				{dict.datagrid.na}
			</span>
		</DataViewFilterSelectItemUI>
	</>
}
