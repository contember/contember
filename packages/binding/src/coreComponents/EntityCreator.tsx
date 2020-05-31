import * as React from 'react'
import { AccessorTree, SuccessfulPersistResult, useAccessorTreeState } from '../accessorTree'
import { MarkerFactory } from '../queryLanguage'
import { SugaredUnconstrainedQualifiedEntityList } from '../treeParameters'
import { Component } from './Component'

export interface EntityCreatorProps extends SugaredUnconstrainedQualifiedEntityList {
	children: React.ReactNode
	onSuccessfulPersist?: (result: SuccessfulPersistResult) => void
}

export const EntityCreator = Component<EntityCreatorProps>(
	props => {
		const children = React.useMemo(() => <EntityCreator {...props}>{props.children}</EntityCreator>, [props])
		const [accessorTreeState] = useAccessorTreeState({
			nodeTree: children,
			unstable_onSuccessfulPersist: props.onSuccessfulPersist,
		})

		return <AccessorTree state={accessorTreeState}>{props.children}</AccessorTree>
	},
	{
		generateMarkerSubTree: (props, fields, environment) =>
			MarkerFactory.createUnconstrainedEntityListMarkerSubTree(environment, props, fields),
	},
	'EntityCreator',
)
