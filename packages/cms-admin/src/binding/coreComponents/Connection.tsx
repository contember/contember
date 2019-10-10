import { Input } from '@contember/schema'
import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { RelativeSingleField, UniqueWhere } from '../bindingTypes'
import { ConnectionMarker } from '../dao'
import { QueryLanguage } from '../queryLanguage'
import { Component } from './Component'

export interface ConnectionProps {
	field: RelativeSingleField
	to: UniqueWhere | Input.UniqueWhere<GraphQlBuilder.Literal>
}

export const Connection = Component<ConnectionProps>(
	() => null,
	{
		generateConnectionMarker: (props, environment) =>
			new ConnectionMarker(
				props.field,
				typeof props.to === 'string' ? QueryLanguage.parseUniqueWhere(props.to, environment) : props.to,
			),
	},
	'Connection',
)
