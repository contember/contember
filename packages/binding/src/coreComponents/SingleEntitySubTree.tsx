import { useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import {
	useAccessorUpdateSubscription,
	useGetSubTree,
	useSingleEntitySubTreeParameters,
} from '../accessorPropagation'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import { MarkerFactory } from '../queryLanguage'
import { SugaredQualifiedSingleEntity, SugaredUnconstrainedQualifiedSingleEntity } from '../treeParameters'
import { Component } from './Component'
import { Field } from './Field'
import { HasOne } from './HasOne'
import { SingleEntity, SingleEntityBaseProps } from './SingleEntity'

export type SingleEntitySubTreeProps<EntityProps> = {
	children?: React.ReactNode
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
		const parameters = useSingleEntitySubTreeParameters(props)
		const getAccessor = React.useCallback(() => getSubTree(parameters), [getSubTree, parameters])
		const accessor = useAccessorUpdateSubscription(getAccessor)

		return (
			<SingleEntity {...props} accessor={accessor}>
				{parameters.value.hasOneRelationPath.length ? (
					<HasOne field={parameters.value.hasOneRelationPath}>{props.children}</HasOne>
				) : (
					props.children
				)}
			</SingleEntity>
		)
	},
	{
		generateSubTreeMarker: (props, fields, environment) => {
			if ('isCreating' in props && props.isCreating) {
				return MarkerFactory.createUnconstrainedSingleEntitySubTreeMarker(environment, props, fields)
			}
			return MarkerFactory.createSingleEntitySubTreeMarker(environment, props, fields)
		},
		staticRender: props => (
			<SingleEntity {...props} accessor={0 as any}>
				<Field field={PRIMARY_KEY_NAME} />
				<Field field={TYPENAME_KEY_NAME} />
				{props.children}
			</SingleEntity>
		),
	},
	'SingleEntitySubTree',
) as <EntityProps>(pros: SingleEntitySubTreeProps<EntityProps>) => React.ReactElement
