import * as React from 'react'
import { AccessorTreeStateContext, useAccessorTreeState } from '../accessorTree'
import { EntityName } from '../bindingTypes'
import { MarkerTreeRoot } from '../dao'
import { Component } from './Component'

interface EntityCreatorProps {
	entityName: EntityName
	children: React.ReactNode
}

export const EntityCreator = Component<EntityCreatorProps>(
	props => {
		const children = React.useMemo(() => <EntityCreator {...props}>{props.children}</EntityCreator>, [props])
		const accessorTreeState = useAccessorTreeState(children)

		return (
			<AccessorTreeStateContext.Provider value={accessorTreeState}>{props.children}</AccessorTreeStateContext.Provider>
		)
	},
	{
		generateMarkerTreeRoot: (props, fields, environment) =>
			new MarkerTreeRoot(environment.getSystemVariable('treeIdSeed'), props.entityName, fields, undefined),
	},
	'EntityCreator',
)
