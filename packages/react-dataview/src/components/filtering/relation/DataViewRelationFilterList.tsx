import * as React from 'react'
import { ReactNode } from 'react'
import { Component, EntityListSubTree } from '@contember/react-binding'
import { useDataViewRelationFilterData } from '../../../hooks'
import { useDataViewFilterName, useDataViewRelationFilterArgs } from '../../../contexts'

export type DataViewRelationFilterListProps = {
	name?: string
	children: ReactNode
}

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
