import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createNumberRangeFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'


export interface DataViewNumberFilterProps {
	field: SugaredRelativeSingleField['field']
	name?: string
	children: React.ReactNode
}

export const DataViewNumberFilter = Component< DataViewNumberFilterProps>(({ name, field, children }) => (
	<DataViewFilter name={getFilterName(name, field)} filterHandler={createNumberRangeFilter(field)}>{children}</DataViewFilter>
))
