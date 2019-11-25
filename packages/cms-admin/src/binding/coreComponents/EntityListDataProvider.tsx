import * as React from 'react'
import { AccessorTreeStateContext, useAccessorTreeState } from '../accessorTree'
import { MarkerFactory } from '../markers'
import { SubTreeIdentifier, SugaredEntityListTreeConstraints } from '../treeParameters'
import { Component } from './Component'

export interface EntityListDataProviderProps extends SugaredEntityListTreeConstraints {
	subTreeIdentifier?: SubTreeIdentifier
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

		return (
			<AccessorTreeStateContext.Provider value={accessorTreeState}>{props.children}</AccessorTreeStateContext.Provider>
		)
	},
	{
		generateMarkerTreeRoot: (props, fields, environment) =>
			MarkerFactory.createEntityListMarkerTreeRoot(
				environment,
				{
					entityName: props.entityName,
					filter: props.filter,
					orderBy: props.orderBy,
					offset: props.offset,
					limit: props.limit,
				},
				fields,
				props.subTreeIdentifier,
			),
	},
	'EntityListDataProvider',
)
