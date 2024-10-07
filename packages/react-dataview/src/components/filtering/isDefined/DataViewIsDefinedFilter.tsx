import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { DataViewFilter } from '../DataViewFilter'
import { createIsDefinedFilter } from '../../../filterTypes'

export interface DataViewIsDefinedFilterProps {
	field: SugaredRelativeSingleField['field']
	name?: string
	children: React.ReactNode
}

export const DataViewIsDefinedFilter = Component<DataViewIsDefinedFilterProps>(({ name, field, children }) => (
	<DataViewFilter name={getFilterName(name, field)} filterHandler={createIsDefinedFilter(field)}>
		{children}
	</DataViewFilter>
))
