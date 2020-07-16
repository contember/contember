import * as React from 'react'
import { useRelativeEntityList } from '../accessorPropagation'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import { Environment } from '../dao'
import { MarkerFactory } from '../queryLanguage'
import { SugaredRelativeEntityList } from '../treeParameters'
import { Component } from './Component'
import { EntityList, EntityListBaseProps } from './EntityList'
import { Field } from './Field'
import { SingleEntityBaseProps } from './SingleEntity'

export type HasManyProps<ListProps = never, EntityProps = never> = SugaredRelativeEntityList & {
	children?: React.ReactNode
	variables?: Environment.DeltaFactory
} & (
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

export const HasMany = Component(
	<ListProps, EntityProps>(props: HasManyProps<ListProps, EntityProps>) => {
		const entity = useRelativeEntityList(props)

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
			<>
				<Field field={PRIMARY_KEY_NAME} />
				<Field field={TYPENAME_KEY_NAME} />
				{props.children}
			</>
		),
		generateRelationMarker: (props, fields, environment) =>
			MarkerFactory.createRelativeEntityListFields(props, environment, fields),
	},
	'HasMany',
) as <ListProps, EntityProps>(props: HasManyProps<ListProps, EntityProps>) => React.ReactElement
