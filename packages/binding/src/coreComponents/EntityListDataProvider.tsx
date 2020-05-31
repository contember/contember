import * as React from 'react'
import { AccessorTree, useAccessorTreeState } from '../accessorTree'
import { MarkerFactory } from '../queryLanguage'
import { SugaredQualifiedEntityList } from '../treeParameters'
import { Component } from './Component'

export interface EntityListDataProviderProps extends SugaredQualifiedEntityList {
	children: React.ReactNode
}

export const EntityListDataProvider = Component<EntityListDataProviderProps>(
	props => {
		const children = React.useMemo(() => <EntityListDataProvider {...props}>{props.children}</EntityListDataProvider>, [
			props,
		])
		const [accessorTreeState] = useAccessorTreeState({
			nodeTree: children,
		})

		return <AccessorTree state={accessorTreeState}>{props.children}</AccessorTree>
	},
	{
		generateMarkerSubTree: (props, fields, environment) =>
			MarkerFactory.createEntityListMarkerSubTree(environment, props, fields),
	},
	'EntityListDataProvider',
)
