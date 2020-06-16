import * as React from 'react'
import { useRelativeSingleEntity } from '../accessorPropagation'
import { MarkerFactory } from '../queryLanguage'
import { SugaredRelativeSingleEntity } from '../treeParameters'
import { Component } from './Component'
import { SingleEntity, SingleEntityBaseProps } from './SingleEntity'

export type HasOneProps<EntityProps = never> = SugaredRelativeSingleEntity & {
	children?: React.ReactNode
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
		generateReferenceMarker: (props, fields, environment) =>
			MarkerFactory.createRelativeSingleEntityFields(props, environment, fields),
	},
	'HasOne',
) as <EntityProps extends {}>(props: HasOneProps<EntityProps>) => React.ReactElement
