import { ComponentType, ReactElement, ReactNode } from 'react'
import { useEntity } from '../accessorPropagation'
import { PRIMARY_KEY_NAME } from '../bindingTypes'
import { Environment } from '../dao'
import { MarkerFactory } from '../queryLanguage'
import { SugaredRelativeSingleEntity } from '../treeParameters'
import { Component } from './Component'
import { Entity, EntityBaseProps } from './Entity'
import { Field } from './Field'

export type HasOneProps<EntityProps = never> = SugaredRelativeSingleEntity & {
	children?: ReactNode
	variables?: Environment.DeltaFactory
} & (
		| {}
		| {
				entityComponent: ComponentType<EntityProps & EntityBaseProps>
				entityProps?: EntityProps
		  }
	)

export const HasOne = Component(
	<EntityProps extends {}>(props: HasOneProps<EntityProps>) => {
		const entity = useEntity(props)

		return <Entity {...props} accessor={entity} />
	},
	{
		generateEnvironment: (props, oldEnvironment) => {
			if (props.variables === undefined) {
				return oldEnvironment
			}
			return oldEnvironment.putDelta(Environment.generateDelta(oldEnvironment, props.variables))
		},
		staticRender: props => (
			<Entity {...props} accessor={undefined as any}>
				<Field field={PRIMARY_KEY_NAME} />
				{props.children}
			</Entity>
		),
		generateBranchMarker: (props, fields, environment) =>
			MarkerFactory.createRelativeSingleEntityFields(props, environment, fields),
	},
	'HasOne',
) as <EntityProps extends {}>(props: HasOneProps<EntityProps>) => ReactElement
