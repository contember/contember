import * as React from 'react'
import { useRelativeEntityList } from '../accessorPropagation'
import { ReferenceMarker } from '../markers'
import { MarkerFactory } from '../queryLanguage'
import { SugaredRelativeEntityList } from '../treeParameters'
import { Component } from './Component'
import { EntityList, EntityListBaseProps } from './EntityList'
import { SingleEntityBaseProps } from './SingleEntity'

export type HasManyProps<ListProps = never, EntityProps = never> = SugaredRelativeEntityList & {
	preferences?: Partial<ReferenceMarker.ReferencePreferences>
	children?: React.ReactNode
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
		generateReferenceMarker: (props, fields, environment) =>
			MarkerFactory.createRelativeEntityListFields(props, environment, fields, props.preferences),
	},
	'HasMany',
) as <ListProps, EntityProps>(props: HasManyProps<ListProps, EntityProps>) => React.ReactElement
