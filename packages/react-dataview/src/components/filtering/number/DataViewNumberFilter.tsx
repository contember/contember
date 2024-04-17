import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createNumberRangeFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'
import { DataViewFilterNameContext } from '../../../contexts'


export interface DataViewNumberFilterProps {
	field: SugaredRelativeSingleField['field']
	name?: string
	children: React.ReactNode
}

export const DataViewNumberFilter = Component< DataViewNumberFilterProps>(({ name, field, children }) => {
	const nameResolved = getFilterName(name, field)

	return (
		<DataViewFilterNameContext.Provider value={nameResolved}>
			{children}
		</DataViewFilterNameContext.Provider>
	)
}, ({ name, field }) => {
	return <DataViewFilter name={getFilterName(name, field)} filterHandler={createNumberRangeFilter(field)} />
})
