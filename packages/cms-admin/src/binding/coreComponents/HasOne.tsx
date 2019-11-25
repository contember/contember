import * as React from 'react'
import { useRelativeSingleEntity } from '../accessorRetrievers'
import { MarkerFactory } from '../markers'
import { SugaredRelativeSingleEntity } from '../treeParameters'
import { Component } from './Component'
import { Entity } from './Entity'

export interface HasOneProps {
	field: SugaredRelativeSingleEntity
	children: React.ReactNode
}

export const HasOne = Component<HasOneProps>(
	props => {
		const entity = useRelativeSingleEntity(props.field)

		return <Entity accessor={entity}>{props.children}</Entity>
	},
	{
		generateReferenceMarker: (props, fields, environment) =>
			MarkerFactory.createRelativeSingleEntityFields(props.field, environment, fields),
	},
	'HasOne',
)
