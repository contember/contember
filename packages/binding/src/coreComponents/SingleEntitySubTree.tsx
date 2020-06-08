import { useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import { useEnvironment, useGetSubTree } from '../accessorPropagation'
import { MarkerFactory, QueryLanguage } from '../queryLanguage'
import {
	BoxedQualifiedSingleEntity,
	BoxedUnconstrainedQualifiedSingleEntity,
	SugaredQualifiedSingleEntity,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
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

		const getSubTree = useGetSubTree()
		const environment = useEnvironment()
		const parameters: BoxedQualifiedSingleEntity | BoxedUnconstrainedQualifiedSingleEntity = React.useMemo(() => {
			if ('isCreating' in props && props.isCreating) {
				return new BoxedUnconstrainedQualifiedSingleEntity(
					QueryLanguage.desugarUnconstrainedQualifiedSingleEntity(props, environment),
				)
			}
			return new BoxedQualifiedSingleEntity(QueryLanguage.desugarQualifiedSingleEntity(props, environment))
		}, [environment, props])

		return <SingleEntity {...props} accessor={getSubTree(parameters)} />
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
