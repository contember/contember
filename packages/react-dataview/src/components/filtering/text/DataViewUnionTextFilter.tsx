import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { createUnionTextFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'
import { DataViewFilterNameContext } from '../../../contexts'


export interface DataViewUnionTextFilterProps {
	fields: SugaredRelativeSingleField['field'] | SugaredRelativeSingleField['field'][]
	name: string
	children: React.ReactNode
}

export const DataViewUnionTextFilter = Component< DataViewUnionTextFilterProps>(({ name, children }) => {
	return (
		<DataViewFilterNameContext.Provider value={name}>
			{children}
		</DataViewFilterNameContext.Provider>
	)
}, ({ name, fields }) => {
	return <DataViewFilter name={name} filterHandler={createUnionTextFilter(fields)} />
})
