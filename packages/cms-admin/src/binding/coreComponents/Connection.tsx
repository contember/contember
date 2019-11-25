import * as React from 'react'
import { MarkerFactory } from '../markers'
import { SugaredRelativeSingleField, SugaredUniqueWhere } from '../treeParameters'
import { Component } from './Component'

export interface ConnectionProps {
	field: SugaredRelativeSingleField
	to: SugaredUniqueWhere
	isNonbearing?: boolean
}

export const Connection = Component<ConnectionProps>(
	() => null,
	{
		generateConnectionMarker: (props, environment) =>
			MarkerFactory.createConnectionMarker(props.field, props.to, environment, props.isNonbearing),
	},
	'Connection',
)
