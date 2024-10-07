import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createDateFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'


export interface DataViewDateFilterProps {
	field: SugaredRelativeSingleField['field']
	name?: string
	children: React.ReactNode
}

export const DataViewDateFilter = Component< DataViewDateFilterProps>(({ name, field, children }) => (
	<DataViewFilter name={getFilterName(name, field)} filterHandler={createDateFilter(field)}>{children}</DataViewFilter>
))
