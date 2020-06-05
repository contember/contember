import * as React from 'react'
import { useRelativeSingleEntity } from '../accessorPropagation'
import { MarkerFactory } from '../queryLanguage'
import { SugaredRelativeSingleEntity } from '../treeParameters'
import { Component } from './Component'
import { SingleEntity } from './SingleEntity'

export interface HasOneProps extends SugaredRelativeSingleEntity {
	children?: React.ReactNode
}

export const HasOne = Component<HasOneProps>(
	props => {
		const entity = useRelativeSingleEntity(props)

		return <SingleEntity accessor={entity}>{props.children}</SingleEntity>
	},
	{
		generateReferenceMarker: (props, fields, environment) =>
			MarkerFactory.createRelativeSingleEntityFields(props, environment, fields),
	},
	'HasOne',
)
