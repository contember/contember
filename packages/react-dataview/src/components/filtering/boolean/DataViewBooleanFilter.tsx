import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createBooleanFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'

export interface DataViewBooleanFilterProps {
	/**
	 * The field to apply the boolean filter to.
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
 * Provides a boolean filter within a data view, including context and a filter handler.
 *
 * ## Props
 * - field, name, children
 *
 * See {@link DataViewBooleanFilterProps} for details.
 *
 * ## Example
 * ```tsx
 * <DataViewBooleanFilter field="published">
 *   //  Filter controls here 
 * </DataViewBooleanFilter>
 * ```
 */
export const DataViewBooleanFilter = Component<DataViewBooleanFilterProps>(({ name, field, children }) => (
	<DataViewFilter name={getFilterName(name, field)} filterHandler={createBooleanFilter(field)}>
		{children}
	</DataViewFilter>
))
