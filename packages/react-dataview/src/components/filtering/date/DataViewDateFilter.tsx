import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createDateFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'

export interface DataViewDateFilterProps {
	/**
	 * The field to apply the date filter to.
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
 * Provides a date filter within a data view, including context and a filter handler.
 *
 * ## Props
 * - field, name, children
 *
 * See {@link DataViewDateFilterProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewDateFilter field="createdAt">
 *   //  Filter controls here 
 * </DataViewDateFilter>
 * ```
 */
export const DataViewDateFilter = Component<DataViewDateFilterProps>(({ name, field, children }) => (
	<DataViewFilter name={getFilterName(name, field)} filterHandler={createDateFilter(field)}>
		{children}
	</DataViewFilter>
))
