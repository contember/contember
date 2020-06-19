import * as React from 'react'
import { MarkerFactory } from '../queryLanguage'
import { SugaredUniqueWhere } from '../treeParameters'
import { Component } from './Component'

export interface ConnectionProps {
	field: string
	to: SugaredUniqueWhere
}

export const Connection = Component<ConnectionProps>(
	() => null,
	{
		generateConnectionMarker: (props, environment) =>
			MarkerFactory.createConnectionMarker(props.field, props.to, environment),
	},
	'Connection',
)
