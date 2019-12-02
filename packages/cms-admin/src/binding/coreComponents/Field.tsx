import { GraphQlBuilder } from '@contember/client'
import * as React from 'react'
import { useRelativeSingleField } from '../accessorRetrievers'
import { MarkerFactory } from '../markers'
import { FieldValue, SugaredRelativeSingleField } from '../treeParameters'
import { Component } from './Component'

export interface FieldBasicProps extends SugaredRelativeSingleField {}

export interface FieldRuntimeProps {
	format?: (value: FieldValue) => React.ReactNode
}

export interface FieldProps extends FieldBasicProps, FieldRuntimeProps {}

export const Field = Component<FieldProps>(
	props => {
		const field = useRelativeSingleField(props)

		if (props.format !== undefined) {
			return <>{props.format(field.currentValue)}</>
		}

		if (
			field.currentValue instanceof GraphQlBuilder.Literal ||
			field.currentValue === null ||
			typeof field.currentValue === 'boolean'
		) {
			return null
		}
		return <>{field.currentValue}</>
	},
	(props, environment) => MarkerFactory.createFieldMarker(props, environment),
	'Field',
)
