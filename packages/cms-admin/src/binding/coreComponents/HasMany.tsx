import * as React from 'react'
import { AccessorContext, useRelativeEntityList } from '../accessorRetrievers'
import { MarkerFactory, ReferenceMarker } from '../markers'
import { SugaredRelativeEntityList } from '../treeParameters'
import { Component } from './Component'
import { Entity } from './Entity'

export interface HasManyProps {
	field: SugaredRelativeEntityList
	preferences?: Partial<ReferenceMarker.ReferencePreferences>
	children: React.ReactNode
}

export const HasMany = Component<HasManyProps>(
	props => {
		const entity = useRelativeEntityList(props.field)

		return (
			<>
				{entity.getFilteredEntities().map(entity => (
					<Entity key={entity.getKey()} accessor={entity}>
						{props.children}
					</Entity>
				))}
			</>
		)
	},
	{
		generateReferenceMarker: (props, fields, environment) =>
			MarkerFactory.createRelativeEntityListFields(props.field, environment, fields, props.preferences),
	},
	'HasMany',
)
