import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { DataViewFilter } from '../DataViewFilter'
import { createIsDefinedFilter } from '../../../filterTypes'

export interface DataViewIsDefinedFilterProps {
	/**
	 * The field to apply the "is defined" filter to.
	 */
	field: SugaredRelativeSingleField['field']

	/**
	 * An optional custom name for the filter.
	 * Defaults to the field name if not provided.
	 */
	name?: string

	/**
	 * The content or UI controls to render inside the filter.
	 * Typically, this includes filter triggers or related components.
	 */
	children: React.ReactNode
}

/**
 * Provides a filter within a data view to check whether a field is defined.
 *
 * ## Props
 * - field, name, children
 *
 * See {@link DataViewIsDefinedFilterProps} for details.
 *
 * ## Example
 * ```tsx
 * <DataViewIsDefinedFilter field="profilePicture">
 *   //  Filter controls here 
 * </DataViewIsDefinedFilter>
 * ```
 */
export const DataViewIsDefinedFilter = Component<DataViewIsDefinedFilterProps>(({ name, field, children }) => (
	<DataViewFilter name={getFilterName(name, field)} filterHandler={createIsDefinedFilter(field)}>
		{children}
	</DataViewFilter>
))
