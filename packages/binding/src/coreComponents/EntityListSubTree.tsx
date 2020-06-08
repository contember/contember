import { useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import { useEnvironment, useGetSubTree } from '../accessorPropagation'
import { MarkerFactory, QueryLanguage } from '../queryLanguage'
import {
	BoxedQualifiedEntityList,
	BoxedUnconstrainedQualifiedEntityList,
	SugaredQualifiedEntityList,
	SugaredUnconstrainedQualifiedEntityList,
} from '../treeParameters'
import { Component } from './Component'
import { EntityList, EntityListBaseProps } from './EntityList'
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
				entityProps: EntityProps
		  }
		| {
				listComponent: React.ComponentType<ListProps & EntityListBaseProps>
				listProps: ListProps
		  }
	)

export const EntityListSubTree = Component(
	<ListProps, EntityProps>(props: EntityListSubTreeProps<ListProps, EntityProps>) => {
		useConstantValueInvariant(props.isCreating, 'EntityListSubTree: cannot update isCreating')

		const getSubTree = useGetSubTree()
		const environment = useEnvironment()
		const parameters: BoxedQualifiedEntityList | BoxedUnconstrainedQualifiedEntityList = React.useMemo(() => {
			if ('isCreating' in props && props.isCreating) {
				return new BoxedUnconstrainedQualifiedEntityList(
					QueryLanguage.desugarUnconstrainedQualifiedEntityList(props, environment),
				)
			}
			return new BoxedQualifiedEntityList(QueryLanguage.desugarQualifiedEntityList(props, environment))
		}, [environment, props])

		return <EntityList {...props} accessor={getSubTree(parameters)} />
	},
	{
		generateMarkerSubTree: (props, fields, environment) => {
			if ('isCreating' in props && props.isCreating) {
				return MarkerFactory.createUnconstrainedEntityListMarkerSubTree(environment, props, fields)
			}
			return MarkerFactory.createEntityListMarkerSubTree(environment, props, fields)
		},
	},
	'EntityListSubTree',
) as <ListProps, EntityProps>(props: EntityListSubTreeProps<ListProps, EntityProps>) => React.ReactElement
