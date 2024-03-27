import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createTextFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'
import { DataViewFilterNameContext } from '../../../contexts'


export interface DataViewTextFilterProps {
	field: SugaredRelativeSingleField['field']
	name?: string
	children: React.ReactNode
}

export const DataViewTextFilter = Component< DataViewTextFilterProps>(({ name, field, children }) => {
	const nameResolved = getFilterName(name, field)

	return (
		<DataViewFilterNameContext.Provider value={nameResolved}>
			{children}
		</DataViewFilterNameContext.Provider>
	)
}, ({ name, field }) => {
	return <DataViewFilter name={getFilterName(name, field)} filterHandler={createTextFilter(field)} />
})
