import { whereToFilter } from '@contember/client'
import { useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import { useAccessorUpdateSubscription, useEntitySubTreeParameters, useGetEntitySubTree } from '../accessorPropagation'
import { SetOrderFieldOnCreate, SetOrderFieldOnCreateOwnProps } from '../accessorSorting'
import { NIL_UUID, PRIMARY_KEY_NAME } from '../bindingTypes'
import { Environment } from '../dao'
import { MarkerFactory, QueryLanguage } from '../queryLanguage'
import { SugaredQualifiedSingleEntity, SugaredUnconstrainedQualifiedSingleEntity } from '../treeParameters'
import { Component } from './Component'
import { Entity, EntityBaseProps } from './Entity'
import { Field } from './Field'
import { HasOne } from './HasOne'

export interface EntitySubTreeAdditionalProps {
	variables?: Environment.DeltaFactory
}

export type EntitySubTreeAdditionalCreationProps = {} | SetOrderFieldOnCreateOwnProps

export type EntitySubTreeProps<EntityProps> = {
	children?: React.ReactNode
} & EntitySubTreeAdditionalProps &
	(
		| ({
				isCreating?: false
		  } & SugaredQualifiedSingleEntity)
		| ({
				isCreating: true
		  } & SugaredUnconstrainedQualifiedSingleEntity &
				EntitySubTreeAdditionalCreationProps)
	) &
	(
		| {}
		| {
				entityComponent: React.ComponentType<EntityProps & EntityBaseProps>
				entityProps?: EntityProps
		  }
	)

export const EntitySubTree = Component(
	<EntityProps extends {}>(props: EntitySubTreeProps<EntityProps>) => {
		useConstantValueInvariant(props.isCreating, 'EntitySubTree: cannot update isCreating')

		const getSubTree = useGetEntitySubTree()
		const parameters = useEntitySubTreeParameters(props)
		const getAccessor = React.useCallback(() => getSubTree(parameters), [getSubTree, parameters])
		const accessor = useAccessorUpdateSubscription(getAccessor)

		return (
			<Entity {...props} accessor={accessor}>
				{parameters.value.hasOneRelationPath.length ? (
					<HasOne field={parameters.value.hasOneRelationPath}>{props.children}</HasOne>
				) : (
					props.children
				)}
			</Entity>
		)
	},
	{
		generateSubTreeMarker: (props, fields, environment) => {
			if ('isCreating' in props && props.isCreating) {
				return MarkerFactory.createUnconstrainedEntitySubTreeMarker(environment, props, fields)
			}
			return MarkerFactory.createEntitySubTreeMarker(environment, props, fields)
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
			const newEnvironment =
				props.variables === undefined
					? oldEnvironment
					: oldEnvironment.putDelta(Environment.generateDelta(oldEnvironment, props.variables))

			if (newEnvironment.hasName('rootWhere') || newEnvironment.hasName('rootWhereAsFilter')) {
				return newEnvironment
			}

			if (props.isCreating) {
				const rootWhere = { id: NIL_UUID } as const
				return newEnvironment.putDelta({
					rootWhere,
					rootWhereAsFilter: whereToFilter(rootWhere),
				})
			}
			const qualifiedSingleEntity = QueryLanguage.desugarQualifiedSingleEntity(props, newEnvironment)
			return newEnvironment.putDelta({
				rootWhere: qualifiedSingleEntity.where,
				rootWhereAsFilter: whereToFilter(qualifiedSingleEntity.where),
			})
		},
	},
	'EntitySubTree',
) as <EntityProps>(pros: EntitySubTreeProps<EntityProps>) => React.ReactElement
