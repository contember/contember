import * as React from 'react'
import { AccessorTreeStateContext, useAccessorTreeState } from '../accessorTree'
import { MarkerFactory } from '../markers'
import { SubTreeIdentifier, SugaredQualifiedSingleEntity } from '../treeParameters'
import { Component } from './Component'

export interface SingleEntityDataProviderProps extends SugaredQualifiedSingleEntity {
	subTreeIdentifier?: SubTreeIdentifier
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

		return (
			<AccessorTreeStateContext.Provider value={accessorTreeState}>{props.children}</AccessorTreeStateContext.Provider>
		)
	},
	{
		generateMarkerTreeRoot: (props, fields, environment) =>
			MarkerFactory.createSingleEntityMarkerTreeRoot(environment, props, fields, props.subTreeIdentifier),
	},
	'SingleEntityDataProvider',
)
