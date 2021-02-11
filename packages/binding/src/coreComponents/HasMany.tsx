import * as React from 'react'
import { useEntityList } from '../accessorPropagation'
import { PRIMARY_KEY_NAME } from '../bindingTypes'
import { Environment } from '../dao'
import { MarkerFactory } from '../queryLanguage'
import { SugaredRelativeEntityList } from '../treeParameters'
import { Component } from './Component'
import { EntityBaseProps } from './Entity'
import { EntityList, EntityListBaseProps } from './EntityList'
import { Field } from './Field'

export type HasManyProps<ListProps = never, EntityProps = never> = SugaredRelativeEntityList & {
	children?: React.ReactNode
	variables?: Environment.DeltaFactory
} & (
		| {}
		| {
				entityComponent: React.ComponentType<EntityProps & EntityBaseProps>
				entityProps?: EntityProps
		  }
		| {
				listComponent: React.ComponentType<ListProps & EntityListBaseProps>
				listProps?: ListProps
		  }
	)

export const HasMany = Component(
	<ListProps, EntityProps>(props: HasManyProps<ListProps, EntityProps>) => {
		const entity = useEntityList(props)

		return <EntityList {...props} accessor={entity} />
	},
	{
		generateEnvironment: (props, oldEnvironment) => {
			if (props.variables === undefined) {
				return oldEnvironment
			}
			return oldEnvironment.putDelta(Environment.generateDelta(oldEnvironment, props.variables))
		},
		staticRender: props => (
			<EntityList {...props} accessor={undefined as any}>
				<Field field={PRIMARY_KEY_NAME} />
				{props.children}
			</EntityList>
		),
		generateRelationMarker: (props, fields, environment) =>
			MarkerFactory.createRelativeEntityListFields(props, environment, fields),
	},
	'HasMany',
) as <ListProps, EntityProps>(props: HasManyProps<ListProps, EntityProps>) => React.ReactElement
