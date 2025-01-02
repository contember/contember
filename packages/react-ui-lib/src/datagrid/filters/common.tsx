import * as React from 'react'
import { useCallback } from 'react'
import { useDataViewFilterName, useDataViewNullFilter } from '@contember/react-dataview'
import { DataGridFilterSelectItemUI } from '../ui'
import { dict } from '../../dict'

/**
 * @internal
 */
export const DataGridNullFilter = ({ name }: {
	name?: string
}) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	name ??= useDataViewFilterName()
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

