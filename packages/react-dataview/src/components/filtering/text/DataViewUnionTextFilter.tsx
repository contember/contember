import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { createUnionTextFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'
import { DataViewFilterNameContext } from '../../../contexts'

export interface DataViewUnionTextFilterProps {
	/**
	 * The field or fields to apply the union text filter to.
	 * Can be a single field or an array of fields.
	 */
	fields: SugaredRelativeSingleField['field'] | SugaredRelativeSingleField['field'][]

	/**
	 * The name of the filter.
	 * This is required and should be unique for each filter instance.
	 */
	name: string

	/**
	 * The content or UI controls to render inside the filter.
	 * Typically, this includes filter triggers or related components.
	 */
	children: React.ReactNode
}

/**
 * Provides a union text filter within a data view, enabling filtering across multiple fields.
 *
 * This component supports filtering by combining multiple fields using a union operation.
 * It provides context for children and handles filter creation automatically.
 *
 * ## Props
 * - fields, name, children
 *
 * See {@link DataViewUnionTextFilterProps} for details.
 *
 * ## Example
 * ```tsx
 * <DataViewUnionTextFilter name="search" fields={['title', 'description']}>
 *   //  Filter controls here
 * </DataViewUnionTextFilter>
 * ```
 */
export const DataViewUnionTextFilter = Component<DataViewUnionTextFilterProps>(({ name, children }) => {
	return (
		<DataViewFilterNameContext.Provider value={name}>
			{children}
		</DataViewFilterNameContext.Provider>
	)
}, ({ name, fields }) => {
	return <DataViewFilter name={name} filterHandler={createUnionTextFilter(fields)} />
})
