import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createBooleanFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'


export interface DataViewBooleanFilterProps {
	field: SugaredRelativeSingleField['field']
	name?: string
	children: React.ReactNode
}

export const DataViewBooleanFilter = Component<DataViewBooleanFilterProps>(({ name, field, children }) => (
	<DataViewFilter name={getFilterName(name, field)} filterHandler={createBooleanFilter(field)} >
		{children}
	</DataViewFilter>
))
