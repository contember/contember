import { useConstantValueInvariant } from '@contember/react-utils'
import { ComponentType, ReactElement, ReactNode } from 'react'
import { useEntityListSubTree } from '../accessorPropagation'
import type { SugaredQualifiedEntityList, SugaredUnconstrainedQualifiedEntityList, TreeRootId } from '@contember/binding'
import { Environment, MarkerFactory, PRIMARY_KEY_NAME, TreeNodeEnvironmentFactory } from '@contember/binding'
import { Component } from './Component'
import { EntityList, EntityListBaseProps } from './EntityList'
import { Field } from './Field'

export interface EntityListSubTreeAdditionalProps {
	variables?: Environment.ValuesMapWithFactory
}

export type EntityListSubTreeProps<ListProps, EntityProps> = {
	treeRootId?: TreeRootId
	children?: ReactNode
} & EntityListSubTreeAdditionalProps &
(SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList) &
(
	| {}
	| {
		listComponent: ComponentType<ListProps & EntityListBaseProps>
		listProps?: ListProps
		  }
)

/**
 * Creates a subtree with list of entities in current data binding context.
 *
 * @example
 * ```
 * <EntityListSubTree entities="Post" />
 * ```
 *
 * @group Data binding
 */
export const EntityListSubTree = Component(
	<ListProps, EntityProps>(props: EntityListSubTreeProps<ListProps, EntityProps>) => {
		useConstantValueInvariant(props.isCreating, 'EntityListSubTree: cannot update isCreating')
		const accessor = useEntityListSubTree(props, ...props.treeRootId ? [props.treeRootId] : [])

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
			const environment = oldEnvironment.withVariables(props.variables)
			return TreeNodeEnvironmentFactory.createEnvironmentForEntityListSubtree(environment, props)
		},
	},
	'EntityListSubTree',
) as <ListProps, EntityProps>(props: EntityListSubTreeProps<ListProps, EntityProps>) => ReactElement
