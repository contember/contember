import { useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import {
	useAccessorUpdateSubscription__UNSTABLE,
	useEntityListSubTreeParameters,
	useGetSubTree,
} from '../accessorPropagation'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import { MarkerFactory } from '../queryLanguage'
import { SugaredQualifiedEntityList, SugaredUnconstrainedQualifiedEntityList } from '../treeParameters'
import { Component } from './Component'
import { EntityList, EntityListBaseProps } from './EntityList'
import { Field } from './Field'
import { HasOne } from './HasOne'
import { SingleEntityBaseProps } from './SingleEntity'

export type EntityListSubTreeProps<ListProps, EntityProps> = {
	children?: React.ReactNode
} & (
	| ({
			isCreating?: false
	  } & SugaredQualifiedEntityList)
	| ({
			isCreating: true
	  } & SugaredUnconstrainedQualifiedEntityList)
) &
	(
		| {}
		| {
				entityComponent: React.ComponentType<EntityProps & SingleEntityBaseProps>
				entityProps?: EntityProps
		  }
		| {
				listComponent: React.ComponentType<ListProps & EntityListBaseProps>
				listProps?: ListProps
		  }
	)

export const EntityListSubTree = Component(
	<ListProps, EntityProps>(props: EntityListSubTreeProps<ListProps, EntityProps>) => {
		useConstantValueInvariant(props.isCreating, 'EntityListSubTree: cannot update isCreating')

		const getSubTree = useGetSubTree()
		const parameters = useEntityListSubTreeParameters(props)
		const getAccessor = React.useCallback(() => getSubTree(parameters), [getSubTree, parameters])
		const accessor = useAccessorUpdateSubscription__UNSTABLE(getAccessor)

		return (
			<EntityList {...props} accessor={accessor}>
				{parameters.value.hasOneRelationPath.length ? (
					<HasOne field={parameters.value.hasOneRelationPath}>{props.children}</HasOne>
				) : (
					props.children
				)}
			</EntityList>
		)
	},
	{
		generateSubTreeMarker: (props, fields, environment) => {
			if ('isCreating' in props && props.isCreating) {
				return MarkerFactory.createUnconstrainedEntityListSubTreeMarker(environment, props, fields)
			}
			return MarkerFactory.createEntityListSubTreeMarker(environment, props, fields)
		},
		staticRender: props => (
			<EntityList {...props} accessor={0 as any}>
				<Field field={PRIMARY_KEY_NAME} />
				<Field field={TYPENAME_KEY_NAME} />
				{props.children}
			</EntityList>
		),
	},
	'EntityListSubTree',
) as <ListProps, EntityProps>(props: EntityListSubTreeProps<ListProps, EntityProps>) => React.ReactElement
