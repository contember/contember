import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createEnumFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'
import { DataViewEnumFilterArgsContext, DataViewFilterNameContext } from '../../../contexts'
import { useDataViewTargetFieldSchema } from '../../../hooks'


export interface DataViewEnumFilterProps {
	field: SugaredRelativeSingleField['field']
	name?: string
	children: React.ReactNode
}

export const DataViewEnumFilter = Component< DataViewEnumFilterProps>(({ field, children, name }) => {
	const enumName = useDataViewTargetFieldSchema(field).field.enumName
	if (!enumName) {
		throw new Error('Invalid field')
	}
	name ??= getFilterName(name, field)

	return (
		<DataViewFilterNameContext.Provider value={name}>
			<DataViewEnumFilterArgsContext.Provider value={{ enumName }}>
				{children}
			</DataViewEnumFilterArgsContext.Provider>
		</DataViewFilterNameContext.Provider>
	)
}, ({ name, field, children }) => (
	<DataViewFilter name={getFilterName(name, field)} filterHandler={createEnumFilter(field)} >
		{children}
	</DataViewFilter>
))
