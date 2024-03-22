import * as React from 'react'
import { useCallback } from 'react'
import { useDataViewNullFilter } from '@contember/react-dataview'
import { DataGridFilterSelectItemUI } from '../ui'
import { dict } from '../../../dict'

export const DataGridNullFilter = ({ name }: {
	name: string
}) => {

	const [nullFilter, setNullFilter] = useDataViewNullFilter(name)
	const toggleExcludeNull = useCallback(() => setNullFilter('toggleExclude'), [setNullFilter])
	const toggleIncludeNull = useCallback(() => setNullFilter('toggleInclude'), [setNullFilter])

	return <>
		<DataGridFilterSelectItemUI
			onExclude={toggleExcludeNull}
			onInclude={toggleIncludeNull}
			isExcluded={nullFilter === 'exclude'}
			isIncluded={nullFilter === 'include'}
		>
			<span className={'italic'}>
				{dict.datagrid.na}
			</span>
		</DataGridFilterSelectItemUI>
	</>
}

