import * as React from 'react'
import { ReactNode } from 'react'
import { Component, EntityListSubTree } from '@contember/react-binding'
import { useDataViewRelationFilterData } from '../../../hooks'
import { useDataViewFilterName, useDataViewRelationFilterArgs } from '../../../contexts'

export interface DataViewRelationFilterListProps {
	/**
	 * The name of the relation filter.
	 */
	name?: string

	/**
	 * The content to render for each entity.
	 */
	children: ReactNode
}

/**
 * Renders a list of active entities in a relation filter.
 *
 * ## Props
 * - name, children
 *
 * See {@link DataViewRelationFilterListProps} for details.
 *
 * ## Example
 * ```tsx
 * <DataViewRelationFilterList>
 *     <Field field="name" />
 * </DataViewRelationFilterList>
 * ```
 */
export const DataViewRelationFilterList = Component(({ children, name }: DataViewRelationFilterListProps) => {
	const { options } = useDataViewRelationFilterArgs()
	// eslint-disable-next-line react-hooks/rules-of-hooks
	name ??= useDataViewFilterName()
	const [state] = useDataViewRelationFilterData({ name, options, children })

	if (!state.entities) {
		return null
	}

	return <EntityListSubTree {...state.entities} treeRootId={state.treeRootId}>{children}</EntityListSubTree>
}, () => {
	return null
})
