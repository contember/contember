import type { ReactElement, ReactNode } from 'react'
import { useEntity } from '../accessorPropagation'
import { PRIMARY_KEY_NAME } from '@contember/binding'
import { Environment } from '@contember/binding'
import { MarkerFactory } from '@contember/binding'
import type { SugaredRelativeSingleEntity } from '@contember/binding'
import { Component } from './Component'
import { Entity } from './Entity'
import { Field } from './Field'
import { TreeNodeEnvironmentFactory } from '@contember/binding'

export type HasOneProps<EntityProps = never> = SugaredRelativeSingleEntity & {
	children?: ReactNode
	variables?: Environment.ValuesMapWithFactory
}

/**
 * @group Data binding
 */
export const HasOne = Component(
	<EntityProps extends {}>(props: HasOneProps<EntityProps>) => {
		const entity = useEntity(props)

		return <Entity {...props} accessor={entity} />
	},
	{
		generateEnvironment: (props, oldEnvironment) => {
			const environment = oldEnvironment.withVariables(props.variables)
			return TreeNodeEnvironmentFactory.createEnvironmentForEntity(environment, props)
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
