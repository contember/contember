import * as React from 'react'
import { useRelativeEntityList } from '../accessorPropagation'
import { ReferenceMarker } from '../markers'
import { MarkerFactory } from '../queryLanguage'
import { SugaredRelativeEntityList } from '../treeParameters'
import { Component } from './Component'
import { Entity } from './Entity'

export interface HasManyProps extends SugaredRelativeEntityList {
	preferences?: Partial<ReferenceMarker.ReferencePreferences>
	children: React.ReactNode
}

export const HasMany = Component<HasManyProps>(
	props => {
		const entity = useRelativeEntityList(props)

		return (
			<>
				{entity.getFilteredEntities().map(entity => (
					<Entity key={entity.key} accessor={entity}>
						{props.children}
					</Entity>
				))}
			</>
		)
	},
	{
		generateReferenceMarker: (props, fields, environment) =>
			MarkerFactory.createRelativeEntityListFields(props, environment, fields, props.preferences),
	},
	'HasMany',
)
