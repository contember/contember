import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createTextFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'


export interface DataViewTextFilterProps {
	field: SugaredRelativeSingleField['field']
	name?: string
	children: React.ReactNode
}

export const DataViewTextFilter = Component< DataViewTextFilterProps>(({ name, field, children }) => (
	<DataViewFilter name={getFilterName(name, field)} filterHandler={createTextFilter(field)}>{children}</DataViewFilter>
))
