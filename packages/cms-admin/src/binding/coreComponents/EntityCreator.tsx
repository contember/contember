import * as React from 'react'
import { AccessorTreeStateContext, useAccessorTreeState } from '../accessorTree'
import { MarkerTreeRoot } from '../markers'
import { EntityName } from '../treeParameters'
import { Component } from './Component'

interface EntityCreatorProps {
	entityName: EntityName
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
			new MarkerTreeRoot(
				environment.getSystemVariable('treeIdFactory')(),
				{
					entityName: props.entityName,
					type: 'unconstrained',
				},
				fields,
				undefined,
			),
	},
	'EntityCreator',
)
