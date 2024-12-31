import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createNumberRangeFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'

export interface DataViewNumberFilterProps {
	/**
	 * The field to apply the number range filter to.
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
 * Provides a number range filter within a data view, including context and a filter handler.
 *
 * ## Props
 * - field, name, children
 *
 * See {@link DataViewNumberFilterProps} for details.
 *
 * ## Example
 * ```tsx
 * <DataViewNumberFilter field="price">
 *   //  Filter controls here 
 * </DataViewNumberFilter>
 * ```
 */
export const DataViewNumberFilter = Component<DataViewNumberFilterProps>(({ name, field, children }) => (
	<DataViewFilter name={getFilterName(name, field)} filterHandler={createNumberRangeFilter(field)}>
		{children}
	</DataViewFilter>
))
