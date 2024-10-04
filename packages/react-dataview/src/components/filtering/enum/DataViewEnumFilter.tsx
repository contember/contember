import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createEnumFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'


export interface DataViewEnumFilterProps {
	field: SugaredRelativeSingleField['field']
	name?: string
	children: React.ReactNode
}

export const DataViewEnumFilter = Component< DataViewEnumFilterProps>(({ name, field, children }) => (
	<DataViewFilter name={getFilterName(name, field)} filterHandler={createEnumFilter(field)} >
		{children}
	</DataViewFilter>
))
