import { useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import { useSingleEntitySubTree } from '../accessorPropagation'
import { MarkerFactory } from '../queryLanguage'
import { SugaredQualifiedSingleEntity, SugaredUnconstrainedQualifiedSingleEntity } from '../treeParameters'
import { Component } from './Component'
import { SingleEntity, SingleEntityBaseProps } from './SingleEntity'

export type SingleEntitySubTreeProps<EntityProps> = {
	children: React.ReactNode
} & (
	| ({
			isCreating?: false
	  } & SugaredQualifiedSingleEntity)
	| ({
			isCreating: true
	  } & SugaredUnconstrainedQualifiedSingleEntity)
) &
	(
		| {}
		| {
				entityComponent: React.ComponentType<EntityProps & SingleEntityBaseProps>
				entityProps?: EntityProps
		  }
	)

export const SingleEntitySubTree = Component(
	<EntityProps extends {}>(props: SingleEntitySubTreeProps<EntityProps>) => {
		useConstantValueInvariant(props.isCreating, 'SingleEntitySubTree: cannot update isCreating')

		return <SingleEntity {...props} accessor={useSingleEntitySubTree(props)} />
	},
	{
		generateMarkerSubTree: (props, fields, environment) => {
			if ('isCreating' in props && props.isCreating) {
				return MarkerFactory.createUnconstrainedSingleEntityMarkerSubTree(environment, props, fields)
			}
			return MarkerFactory.createSingleEntityMarkerSubTree(environment, props, fields)
		},
	},
	'SingleEntitySubTree',
) as <EntityProps>(pros: SingleEntitySubTreeProps<EntityProps>) => React.ReactElement
