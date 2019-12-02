import * as React from 'react'
import { AccessorTreeStateContext, useAccessorTreeState } from '../accessorTree'
import { MarkerFactory } from '../markers'
import { SugaredUnconstrainedQualifiedEntityList } from '../treeParameters'
import { Component } from './Component'

interface EntityCreatorProps extends SugaredUnconstrainedQualifiedEntityList {
	children: React.ReactNode
}

export const EntityCreator = Component<EntityCreatorProps>(
	props => {
		const children = React.useMemo(() => <EntityCreator {...props}>{props.children}</EntityCreator>, [props])
		const [accessorTreeState] = useAccessorTreeState({
			nodeTree: children,
		})

		return (
			<AccessorTreeStateContext.Provider value={accessorTreeState}>{props.children}</AccessorTreeStateContext.Provider>
		)
	},
	{
		generateMarkerTreeRoot: (props, fields, environment) =>
			MarkerFactory.createUnconstrainedMarkerTreeRoot(environment, props, fields),
	},
	'EntityCreator',
)
