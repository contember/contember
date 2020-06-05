import * as React from 'react'
import { useRelativeEntityList } from '../accessorPropagation'
import { ReferenceMarker } from '../markers'
import { MarkerFactory } from '../queryLanguage'
import { SugaredRelativeEntityList } from '../treeParameters'
import { Component } from './Component'
import { EntityList } from './EntityList'

export interface HasManyProps extends SugaredRelativeEntityList {
	preferences?: Partial<ReferenceMarker.ReferencePreferences>
	children?: React.ReactNode
}

export const HasMany = Component<HasManyProps>(
	props => {
		const entity = useRelativeEntityList(props)

		return <EntityList accessor={entity} children={props.children} />
	},
	{
		generateReferenceMarker: (props, fields, environment) =>
			MarkerFactory.createRelativeEntityListFields(props, environment, fields, props.preferences),
	},
	'HasMany',
)
