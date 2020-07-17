import * as React from 'react'
import { useRelativeSingleEntity } from '../accessorPropagation'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import { Environment } from '../dao'
import { MarkerFactory } from '../queryLanguage'
import { SugaredRelativeSingleEntity } from '../treeParameters'
import { Component } from './Component'
import { Field } from './Field'
import { SingleEntity, SingleEntityBaseProps } from './SingleEntity'

export type HasOneProps<EntityProps = never> = SugaredRelativeSingleEntity & {
	children?: React.ReactNode
	variables?: Environment.DeltaFactory
} & (
		| {}
		| {
				entityComponent: React.ComponentType<EntityProps & SingleEntityBaseProps>
				entityProps?: EntityProps
		  }
	)

export const HasOne = Component(
	<EntityProps extends {}>(props: HasOneProps<EntityProps>) => {
		const entity = useRelativeSingleEntity(props)

		return <SingleEntity {...props} accessor={entity} />
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
			MarkerFactory.createRelativeSingleEntityFields(props, environment, fields),
	},
	'HasOne',
) as <EntityProps extends {}>(props: HasOneProps<EntityProps>) => React.ReactElement
