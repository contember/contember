import * as React from 'react'
import { AccessorTree, useAccessorTreeState } from '../accessorTree'
import { MarkerFactory } from '../queryLanguage'
import { SugaredQualifiedSingleEntity } from '../treeParameters'
import { Component } from './Component'

export interface SingleEntityDataProviderProps extends SugaredQualifiedSingleEntity {
	children: React.ReactNode
}

export const SingleEntityDataProvider = Component<SingleEntityDataProviderProps>(
	props => {
		const children = React.useMemo(
			() => <SingleEntityDataProvider {...props}>{props.children}</SingleEntityDataProvider>,
			[props],
		)
		const [accessorTreeState] = useAccessorTreeState({
			nodeTree: children,
		})

		return <AccessorTree state={accessorTreeState}>{props.children}</AccessorTree>
	},
	{
		generateMarkerTreeRoot: (props, fields, environment) =>
			MarkerFactory.createSingleEntityMarkerTreeRoot(environment, props, fields),
	},
	'SingleEntityDataProvider',
)
