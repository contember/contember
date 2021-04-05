import { whereToFilter } from '@contember/client'
import { useConstantValueInvariant } from '@contember/react-utils'
import { ComponentType, ReactElement, ReactNode, useCallback } from 'react'
import {
	useAccessorUpdateSubscription,
	useEntityListSubTreeParameters,
	useGetEntityListSubTree,
} from '../accessorPropagation'
import { NIL_UUID, PRIMARY_KEY_NAME } from '../bindingTypes'
import { Environment } from '../dao'
import { MarkerFactory } from '../queryLanguage'
import { SugaredQualifiedEntityList, SugaredUnconstrainedQualifiedEntityList, TreeRootId } from '../treeParameters'
import { Component } from './Component'
import { EntityBaseProps } from './Entity'
import { EntityList, EntityListBaseProps } from './EntityList'
import { Field } from './Field'

export interface EntityListSubTreeAdditionalProps {
	variables?: Environment.DeltaFactory
}

export type EntityListSubTreeProps<ListProps, EntityProps> = {
	treeRootId?: TreeRootId
	children?: ReactNode
} & EntityListSubTreeAdditionalProps &
	(SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList) &
	(
		| {}
		| {
				entityComponent: ComponentType<EntityProps & EntityBaseProps>
				entityProps?: EntityProps
		  }
		| {
				listComponent: ComponentType<ListProps & EntityListBaseProps>
				listProps?: ListProps
		  }
	)

export const EntityListSubTree = Component(
	<ListProps, EntityProps>(props: EntityListSubTreeProps<ListProps, EntityProps>) => {
		useConstantValueInvariant(props.isCreating, 'EntityListSubTree: cannot update isCreating')

		const getSubTree = useGetEntityListSubTree()
		const parameters = useEntityListSubTreeParameters(props)
		const getAccessor = useCallback(() => getSubTree(parameters, props.treeRootId), [
			getSubTree,
			parameters,
			props.treeRootId,
		])
		const accessor = useAccessorUpdateSubscription(getAccessor)

		//  TODO revive top level hasOneRelationPath
		// {parameters.value.hasOneRelationPath.length ?
		// 	<HasOne field={parameters.value.hasOneRelationPath}>{props.children}</HasOne
		// ) :
		// 	props.children
		// )
		return <EntityList {...props} accessor={accessor} />
	},
	{
		generateBranchMarker: (props, fields, environment) => {
			if ('isCreating' in props && props.isCreating) {
				return MarkerFactory.createUnconstrainedEntityListSubTreeMarker(props, fields, environment)
			}
			return MarkerFactory.createEntityListSubTreeMarker(props, fields, environment)
		},
		staticRender: props => (
			<EntityList {...props} accessor={0 as any}>
				<Field field={PRIMARY_KEY_NAME} />
				{props.children}
			</EntityList>
		),
		generateEnvironment: (props, oldEnvironment) => {
			const newEnvironment =
				props.variables === undefined
					? oldEnvironment
					: oldEnvironment.putDelta(Environment.generateDelta(oldEnvironment, props.variables))

			if (newEnvironment.hasName('rootWhere') || newEnvironment.hasName('rootWhereAsFilter')) {
				return newEnvironment
			}

			const rootWhere = { id: NIL_UUID } as const
			return newEnvironment.putDelta({
				rootWhere,
				rootWhereAsFilter: whereToFilter(rootWhere),
			})
		},
	},
	'EntityListSubTree',
) as <ListProps, EntityProps>(props: EntityListSubTreeProps<ListProps, EntityProps>) => ReactElement
