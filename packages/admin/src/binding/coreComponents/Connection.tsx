import * as React from 'react'
import { MarkerFactory } from '../markers'
import { SugaredRelativeSingleField, SugaredUniqueWhere } from '../treeParameters'
import { Component } from './Component'

export interface ConnectionProps extends SugaredRelativeSingleField {
	to: SugaredUniqueWhere
}

export const Connection = Component<ConnectionProps>(
	() => null,
	{
		generateConnectionMarker: (props, environment) =>
			MarkerFactory.createConnectionMarker(props, props.to, environment),
	},
	'Connection',
)
