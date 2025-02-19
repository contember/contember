import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { getFilterName } from '../../../internal/helpers/getFilterName'
import { createEnumListFilter } from '../../../filterTypes'
import { DataViewFilter } from '../DataViewFilter'
import { DataViewEnumFilterArgsContext, DataViewFilterNameContext } from '../../../contexts'
import { useDataViewTargetFieldSchema } from '../../../hooks'

export interface DataViewEnumListFilterProps {
	/**
	 * The field to apply the enum filter to.
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
 * Provides an enum filter within a data view, including context and a filter handler.
 *
 * This component sets up the necessary context for working with enum filters
 * and ensures that the specified field is valid for enum filtering.
 *
 * ## Props
 * - field, name, children
 *
 * See {@link DataViewEnumListFilterProps} for details.
 *
 * ## Example
 * ```tsx
 * <DataViewEnumListFilter field="status">
 *   //  Filter controls here
 * </DataViewEnumListFilter>
 * ```
 *
 * @throws Error if the provided field is not valid for enum filtering.
 */
export const DataViewEnumListFilter = Component<DataViewEnumListFilterProps>(({ field, children, name }) => {
	const enumName = useDataViewTargetFieldSchema(field).field.enumName
	if (!enumName) {
		throw new Error('Invalid field')
	}
	name ??= getFilterName(name, field)

	return (
		<DataViewFilterNameContext.Provider value={name}>
			<DataViewEnumFilterArgsContext.Provider value={{ enumName }}>
				{children}
			</DataViewEnumFilterArgsContext.Provider>
		</DataViewFilterNameContext.Provider>
	)
}, ({ name, field, children }) => (
	<DataViewFilter name={getFilterName(name, field)} filterHandler={createEnumListFilter(field)}>
		{children}
	</DataViewFilter>
))
