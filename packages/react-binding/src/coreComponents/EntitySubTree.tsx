import { useConstantValueInvariant } from '@contember/react-utils'
import { ReactElement, ReactNode, useCallback } from 'react'
import { useAccessorUpdateSubscription, useEntitySubTreeParameters, useGetEntitySubTree } from '../accessorPropagation'
import { PRIMARY_KEY_NAME } from '@contember/binding'
import { Environment } from '@contember/binding'
import { MarkerFactory } from '@contember/binding'
import type {
	SugaredQualifiedSingleEntity,
	SugaredUnconstrainedQualifiedSingleEntity,
	TreeRootId,
} from '@contember/binding'
import { Component } from './Component'
import { Entity } from './Entity'
import { Field } from './Field'
import { TreeNodeEnvironmentFactory } from '@contember/binding'
import { SetOrderFieldOnCreate, SetOrderFieldOnCreateOwnProps } from '../accessorSorting'

export interface EntitySubTreeAdditionalProps {
	variables?: Environment.ValuesMapWithFactory
}

export type EntitySubTreeAdditionalCreationProps = {} | SetOrderFieldOnCreateOwnProps

export type EntitySubTreeProps<EntityProps> =
	& {
		treeRootId?: TreeRootId
		children?: ReactNode
	}
	& EntitySubTreeAdditionalProps
	& (
		| SugaredQualifiedSingleEntity
		| (SugaredUnconstrainedQualifiedSingleEntity & EntitySubTreeAdditionalCreationProps)
	)

/**
 * Creates a single entity subtree in current data binding context.
 *
 * @example
 * ```
 * <EntitySubTree entity="Post(id = $id)" />
 * ```
 *
 * @group Data binding
 */
export const EntitySubTree = Component(
	<EntityProps extends {}>(props: EntitySubTreeProps<EntityProps>) => {
		useConstantValueInvariant(props.isCreating, 'EntitySubTree: cannot update isCreating')

		const getSubTree = useGetEntitySubTree()
		const parameters = useEntitySubTreeParameters(props)
		const getAccessor = useCallback(
			() => getSubTree(parameters, props.treeRootId),
			[getSubTree, parameters, props.treeRootId],
		)
		const accessor = useAccessorUpdateSubscription(getAccessor)

		// TODO revive top-level hasOneRelationPath
		// {parameters.value.hasOneRelationPath.length ? (
		// 	<HasOne field={parameters.value.hasOneRelationPath}>{props.children}</HasOne>
		// ) : (
		// 	props.children
		// )}
		return <Entity {...props} accessor={accessor} />
	},
	{
		generateBranchMarker: (props, fields, environment) => {
			if ('isCreating' in props && props.isCreating) {
				return MarkerFactory.createUnconstrainedEntitySubTreeMarker(props, fields, environment)
			}
			return MarkerFactory.createEntitySubTreeMarker(props, fields, environment)
		},
		staticRender: props => (
			<>
				<Entity {...props} accessor={0 as any}>
					<Field field={PRIMARY_KEY_NAME} />
					{props.children}
				</Entity>
				{props.isCreating && 'orderField' in props && (
					<SetOrderFieldOnCreate
						orderField={props.orderField}
						newOrderFieldValue={props.newOrderFieldValue}
						entity={props.entity}
					/>
				)}
			</>
		),
		generateEnvironment: (props, oldEnvironment) => {
			const environment = oldEnvironment.withVariables(props.variables)
			return TreeNodeEnvironmentFactory.createEnvironmentForEntitySubtree(environment, props)
		},
	},
	'EntitySubTree',
) as <EntityProps>(pros: EntitySubTreeProps<EntityProps>) => ReactElement
