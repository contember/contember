import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createTextFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'

export interface DataViewTextFilterProps {
	/**
	 * The field to apply the text filter to.
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
 * Provides a text filter within a data view, including context and a filter handler.
 *
 * ## Props
 * - field, name, children
 *
 * See {@link DataViewTextFilterProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewTextFilter field="name">
 *   //  Filter controls here 
 * </DataViewTextFilter>
 * ```
 */
export const DataViewTextFilter = Component<DataViewTextFilterProps>(({ name, field, children }) => (
	<DataViewFilter name={getFilterName(name, field)} filterHandler={createTextFilter(field)}>
		{children}
	</DataViewFilter>
))
