import * as React from 'react'
import { ReactNode } from 'react'
import { Component, EntityListSubTree } from '@contember/react-binding'
import { SugaredQualifiedEntityList } from '@contember/binding'
import { useDataViewRelationFilterData } from '../../../hooks/filters/relation/useDataViewRelationFilterData'

export type DataViewRelationFilterListProps = {
	name: string
	options: SugaredQualifiedEntityList['entities']
	children: ReactNode
};

export const DataViewRelationFilterList = Component(({ name, options, children }: DataViewRelationFilterListProps) => {
	const [state, loadingState] = useDataViewRelationFilterData({ name, options, children })

	if (loadingState === 'initial' || !state.entities) {
		return null
	}

	return <EntityListSubTree {...state.entities} treeRootId={state.treeRootId}>{children}</EntityListSubTree>
}, ({ options, children }) => {

	return null
	// return <EntityListSubTree {...state.entities} treeRootId={state.treeRootId}>{children}</EntityListSubTree>
})
